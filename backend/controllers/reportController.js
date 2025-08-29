const db = require('../db/connection');
const puppeteer = require('puppeteer');

// NEW: A dedicated function to fetch report data without sending a response.
// This resolves the "headers already sent" error by separating data fetching from the response.
const getReportData = async (type, organizationId, dateFilter, dateParams, propertyId, tenantId) => {
  switch (type) {
    case 'financial':
      return await generateFinancialReport(organizationId, dateFilter, dateParams, propertyId);
    case 'tenant':
      return await generateTenantReport(organizationId, dateFilter, dateParams, tenantId);
    case 'property':
      return await generatePropertyReport(organizationId, dateFilter, dateParams, propertyId);
    case 'maintenance':
      return await generateMaintenanceReport(organizationId, dateFilter, dateParams, propertyId);
    default:
      throw new Error('Invalid report type');
  }
};


// Main report generator
const generateReports = async (req, res) => {
  try {
    const { type, dateRange, startDate, endDate, propertyId, tenantId } = req.query;
    const organizationId = req.user.organization_id;

   // Build date filter
let dateFilter = '';
let dateParams = [];

if (dateRange === 'custom' && startDate && endDate) {
  dateFilter = ' AND DATE(%TABLE_ALIAS%.created_at) BETWEEN ? AND ?';
  dateParams = [startDate, endDate];
} else {
  const now = new Date();
  let filterDate;

  switch (dateRange) {
    case 'week':
      filterDate = new Date(now);
      filterDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      filterDate = new Date(now);
      filterDate.setMonth(now.getMonth() - 1);
      break;
    case 'quarter':
      filterDate = new Date(now);
      filterDate.setMonth(now.getMonth() - 3);
      break;
    case 'year':
      filterDate = new Date(now);
      filterDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      filterDate = new Date(now);
      filterDate.setMonth(now.getMonth() - 1);
  }

  dateFilter = ` AND DATE(%TABLE_ALIAS%.created_at) >= ?`;
  dateParams = [filterDate.toISOString().split('T')[0]];
}

    // FIX: Call the new data fetching function
    const data = await getReportData(type, organizationId, dateFilter, dateParams, propertyId, tenantId);

    return res.json(data);

  } catch (error) {
    console.error('Generate reports error:', error);
    // Send a specific error message if it's an invalid type
    if (error.message === 'Invalid report type') {
        return res.status(400).json({ message: 'Invalid report type' });
    }
    res.status(500).json({ message: 'Server error generating report.' });
  }
};

// NEW: The missing financial report function has been created.
const generateFinancialReport = async (organizationId, dateFilter, dateParams, propertyId) => {
    const propertyFilter = propertyId ? ' AND p.id = ?' : '';
    const propertyParams = propertyId ? [propertyId] : [];

    // Financial Summary Stats
    const [summary] = await db.execute(
        `SELECT
            (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE organization_id = ? AND status = 'paid') as totalCollected,
            (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE organization_id = ? AND status IN ('pending', 'overdue')) as outstanding,
            (SELECT COALESCE(SUM(deposit), 0) FROM rental_contracts WHERE organization_id = ? AND status = 'active') as securityDeposits,
            (SELECT COALESCE(SUM(actual_cost), 0) FROM maintenance_requests WHERE organization_id = ? AND status = 'completed') as expenses
        `,
        [organizationId, organizationId, organizationId, organizationId]
    );

    // Revenue by Property
    const [revenue] = await db.execute(
        `SELECT
            p.name,
            p.total_units,
            (SELECT COUNT(*) FROM property_units WHERE property_id = p.id AND is_occupied = TRUE) as occupiedUnits,
            COALESCE((SELECT SUM(monthly_rent) FROM rental_contracts WHERE property_id = p.id AND status = 'active'), 0) as monthlyRevenue,
            COALESCE(((SELECT COUNT(*) FROM property_units WHERE property_id = p.id AND is_occupied = TRUE) / p.total_units) * 100, 0) as occupancyRate
         FROM properties p
         WHERE p.organization_id = ? ${propertyFilter}
         GROUP BY p.id`,
        [organizationId, ...propertyParams]
    );

    return {
        financial: {
            totalCollected: summary[0].totalCollected,
            outstanding: summary[0].outstanding,
            securityDeposits: summary[0].securityDeposits,
            expenses: summary[0].expenses,
            revenue: revenue,
        }
    };
};

// ---------------- TENANT ----------------
const generateTenantReport = async (organizationId, dateFilter, dateParams, tenantId) => {
  const tenantFilter = tenantId ? ' AND t.id = ?' : '';
  const tenantParams = tenantId ? [tenantId] : [];

  const [tenantStats] = await db.execute(
    `SELECT
      COUNT(CASE WHEN rc.status = 'active' THEN 1 END) as currentTenants,
      COUNT(CASE WHEN rc.status = 'terminated' THEN 1 END) as pastTenants
     FROM tenants t
     LEFT JOIN rental_contracts rc ON t.id = rc.tenant_id
     WHERE t.organization_id = ?${tenantFilter}`,
    [organizationId, ...tenantParams]
  );

  const [tenantList] = await db.execute(
    `SELECT t.id, t.full_name, rc.contract_start_date, rc.contract_end_date,
            p.name as property_name, pu.unit_number,
            COALESCE(SUM(CASE WHEN pay.status IN ('pending','overdue') THEN pay.amount ELSE 0 END),0) as outstanding_balance
     FROM tenants t
     LEFT JOIN rental_contracts rc ON t.id = rc.tenant_id AND rc.status = 'active'
     LEFT JOIN properties p ON rc.property_id = p.id
     LEFT JOIN property_units pu ON rc.unit_id = pu.id
     LEFT JOIN payments pay ON rc.id = pay.contract_id
     WHERE t.organization_id = ?${tenantFilter}
     GROUP BY t.id, t.full_name, rc.contract_start_date, rc.contract_end_date, p.name, pu.unit_number`,
    [organizationId, ...tenantParams]
  );

  return {
    tenant: {
      currentTenants: tenantStats[0].currentTenants,
      pastTenants: tenantStats[0].pastTenants,
      tenantList
    }
  };
};

// ---------------- PROPERTY ----------------
const generatePropertyReport = async (organizationId, dateFilter, dateParams, propertyId) => {
  const propertyFilter = propertyId ? ' AND p.id = ?' : '';
  const propertyParams = propertyId ? [propertyId] : [];

  const [occupancyResult] = await db.execute(
    `SELECT
        COALESCE(AVG(p.occupied_units / p.total_units) * 100, 0) as occupancyRate
     FROM (
        SELECT
            p.id,
            p.total_units,
            (SELECT COUNT(*) FROM property_units WHERE property_id = p.id AND is_occupied = TRUE) as occupied_units
        FROM properties p
        WHERE p.organization_id = ? ${propertyFilter}
     ) as p`,
    [organizationId, ...propertyParams]
  );


  const [vacantUnits] = await db.execute(
    `SELECT p.name as property_name, pu.unit_number, pu.monthly_rent
     FROM property_units pu
     JOIN properties p ON pu.property_id = p.id
     WHERE p.organization_id = ? AND pu.is_occupied = FALSE${propertyFilter}`,
    [organizationId, ...propertyParams]
  );

  const [propertyIncome] = await db.execute(
    `SELECT
        p.name,
        p.total_units,
        (SELECT COUNT(*) FROM property_units WHERE property_id = p.id AND is_occupied = TRUE) as occupiedUnits,
        COALESCE(SUM(rc.monthly_rent),0) as monthlyIncome,
        (SELECT COALESCE(SUM(monthly_rent),0) FROM property_units WHERE property_id = p.id) as potentialIncome
     FROM properties p
     LEFT JOIN rental_contracts rc ON p.id = rc.property_id AND rc.status = 'active'
     WHERE p.organization_id = ?${propertyFilter}
     GROUP BY p.id`,
    [organizationId, ...propertyParams]
  );

  const [expiringLeases] = await db.execute(
    `SELECT rc.*, t.full_name as tenant_name, p.name as property_name, pu.unit_number
     FROM rental_contracts rc
     JOIN tenants t ON rc.tenant_id = t.id
     JOIN properties p ON rc.property_id = p.id
     JOIN property_units pu ON rc.unit_id = pu.id
     WHERE rc.organization_id = ? AND rc.status = 'active'
       AND rc.contract_end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)${propertyFilter}`,
    [organizationId, ...propertyParams]
  );

  return {
    property: {
      occupancyRate: Math.round(occupancyResult[0].occupancyRate),
      vacantUnits,
      propertyIncome,
      expiringLeases
    }
  };
};

// ---------------- MAINTENANCE ----------------
const generateMaintenanceReport = async (organizationId, dateFilter, dateParams, propertyId) => {
  const propertyFilter = propertyId ? ' AND mr.property_id = ?' : '';
  const propertyParams = propertyId ? [propertyId] : [];
  const appliedDateFilter = dateFilter.replace('%TABLE_ALIAS%', 'mr');


  const [maintenanceStats] = await db.execute(
    `SELECT
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as openRequests,
      COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as inProgressRequests,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completedRequests,
      AVG(CASE WHEN status = 'completed' AND completed_date IS NOT NULL THEN DATEDIFF(completed_date, requested_date) END) as avgResolutionTime
     FROM maintenance_requests mr
     WHERE mr.organization_id = ?${propertyFilter}${appliedDateFilter}`,
    [organizationId, ...propertyParams, ...dateParams]
  );

  const [maintenanceByProperty] = await db.execute(
    // FIX: Added 'inProgressRequests' to the query to match what the frontend expects.
    `SELECT p.name,
            COUNT(CASE WHEN mr.status = 'pending' THEN 1 END) as openRequests,
            COUNT(CASE WHEN mr.status = 'in_progress' THEN 1 END) as inProgressRequests,
            COUNT(CASE WHEN mr.status = 'completed' THEN 1 END) as completedRequests,
            COALESCE(SUM(CASE WHEN mr.status='completed' THEN mr.actual_cost ELSE 0 END),0) as totalCost
     FROM properties p
     LEFT JOIN maintenance_requests mr ON p.id = mr.property_id
     WHERE p.organization_id = ?${propertyFilter}
     GROUP BY p.id, p.name`,
    [organizationId, ...propertyParams]
  );

  return {
    maintenance: {
      openRequests: maintenanceStats[0].openRequests,
      inProgressRequests: maintenanceStats[0].inProgressRequests,
      completedRequests: maintenanceStats[0].completedRequests,
      averageResolutionTime: Math.round(maintenanceStats[0].avgResolutionTime || 0),
      requestsByProperty: maintenanceByProperty
    }
  };
};

// PDF Generation Function
const generatePDFReport = async (type, reportData) => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  let htmlContent = '';
  
  switch (type) {
    case 'financial':
      htmlContent = generateFinancialHTML(reportData.financial);
      break;
    case 'tenant':
      htmlContent = generateTenantHTML(reportData.tenant);
      break;
    case 'property':
      htmlContent = generatePropertyHTML(reportData.property);
      break;
    case 'maintenance':
      htmlContent = generateMaintenanceHTML(reportData.maintenance);
      break;
    default:
      htmlContent = '<h1>Invalid Report Type</h1>';
  }
  
  const fullHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${type.charAt(0).toUpperCase() + type.slice(1)} Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e5e5e5; padding-bottom: 20px; }
        .summary-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .card { background: #f8f9fa; padding: 15px; border-radius: 8px; border: 1px solid #e5e5e5; }
        .card-title { font-size: 14px; color: #666; margin-bottom: 5px; }
        .card-value { font-size: 24px; font-weight: bold; color: #333; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e5e5; }
        th { background-color: #f8f9fa; font-weight: bold; color: #555; }
        .section-title { font-size: 18px; font-weight: bold; margin: 30px 0 15px 0; color: #333; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${type.charAt(0).toUpperCase() + type.slice(1)} Report</h1>
        <p>Generated on ${new Date().toLocaleDateString()}</p>
      </div>
      ${htmlContent}
    </body>
    </html>
  `;
  
  await page.setContent(fullHTML);
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: {
      top: '20px',
      right: '20px',
      bottom: '20px',
      left: '20px'
    }
  });
  
  await browser.close();
  return pdfBuffer;
};

const generateFinancialHTML = (data) => {
  return `
    <div class="summary-cards">
      <div class="card">
        <div class="card-title">Total Collected</div>
        <div class="card-value">$${data.totalCollected?.toLocaleString() || 0}</div>
      </div>
      <div class="card">
        <div class="card-title">Outstanding</div>
        <div class="card-value">$${data.outstanding?.toLocaleString() || 0}</div>
      </div>
      <div class="card">
        <div class="card-title">Security Deposits</div>
        <div class="card-value">$${data.securityDeposits?.toLocaleString() || 0}</div>
      </div>
      <div class="card">
        <div class="card-title">Expenses</div>
        <div class="card-value">$${data.expenses?.toLocaleString() || 0}</div>
      </div>
    </div>
    
    <div class="section-title">Revenue by Property</div>
    <table>
      <thead>
        <tr>
          <th>Property</th>
          <th>Monthly Revenue</th>
          <th>Occupied Units</th>
          <th>Occupancy Rate</th>
        </tr>
      </thead>
      <tbody>
        ${data.revenue?.map(property => `
          <tr>
            <td>${property.name}</td>
            <td>$${property.monthlyRevenue?.toLocaleString()}</td>
            <td>${property.occupiedUnits}/${property.total_units}</td>
            <td>${Math.round(property.occupancyRate)}%</td>
          </tr>
        `).join('') || '<tr><td colspan="4">No data available</td></tr>'}
      </tbody>
    </table>
  `;
};

const generateTenantHTML = (data) => {
  return `
    <div class="summary-cards">
      <div class="card">
        <div class="card-title">Current Tenants</div>
        <div class="card-value">${data.currentTenants || 0}</div>
      </div>
      <div class="card">
        <div class="card-title">Past Tenants</div>
        <div class="card-value">${data.pastTenants || 0}</div>
      </div>
    </div>
    
    <div class="section-title">Tenant Information</div>
    <table>
      <thead>
        <tr>
          <th>Tenant Name</th>
          <th>Property</th>
          <th>Lease Start</th>
          <th>Lease End</th>
          <th>Outstanding Balance</th>
        </tr>
      </thead>
      <tbody>
        ${data.tenantList?.map(tenant => `
          <tr>
            <td>${tenant.full_name}</td>
            <td>${tenant.property_name} - Unit ${tenant.unit_number}</td>
            <td>${new Date(tenant.contract_start_date).toLocaleDateString()}</td>
            <td>${new Date(tenant.contract_end_date).toLocaleDateString()}</td>
            <td>$${tenant.outstanding_balance?.toLocaleString() || 0}</td>
          </tr>
        `).join('') || '<tr><td colspan="5">No data available</td></tr>'}
      </tbody>
    </table>
  `;
};

const generatePropertyHTML = (data) => {
  return `
    <div class="summary-cards">
      <div class="card">
        <div class="card-title">Occupancy Rate</div>
        <div class="card-value">${data.occupancyRate || 0}%</div>
      </div>
      <div class="card">
        <div class="card-title">Vacant Units</div>
        <div class="card-value">${data.vacantUnits?.length || 0}</div>
      </div>
      <div class="card">
        <div class="card-title">Expiring Leases</div>
        <div class="card-value">${data.expiringLeases?.length || 0}</div>
      </div>
    </div>
    
    <div class="section-title">Property Income Analysis</div>
    <table>
      <thead>
        <tr>
          <th>Property</th>
          <th>Total Units</th>
          <th>Occupied</th>
          <th>Monthly Income</th>
          <th>Potential Income</th>
        </tr>
      </thead>
      <tbody>
        ${data.propertyIncome?.map(property => `
          <tr>
            <td>${property.name}</td>
            <td>${property.total_units}</td>
            <td>${property.occupiedUnits}</td>
            <td>$${property.monthlyIncome?.toLocaleString()}</td>
            <td>$${property.potentialIncome?.toLocaleString()}</td>
          </tr>
        `).join('') || '<tr><td colspan="5">No data available</td></tr>'}
      </tbody>
    </table>
  `;
};

const generateMaintenanceHTML = (data) => {
  return `
    <div class="summary-cards">
      <div class="card">
        <div class="card-title">Open Requests</div>
        <div class="card-value">${data.openRequests || 0}</div>
      </div>
      <div class="card">
        <div class="card-title">Completed</div>
        <div class="card-value">${data.completedRequests || 0}</div>
      </div>
      <div class="card">
        <div class="card-title">Avg Resolution Time</div>
        <div class="card-value">${data.averageResolutionTime || 0} days</div>
      </div>
    </div>
    
    <div class="section-title">Maintenance Requests by Property</div>
    <table>
      <thead>
        <tr>
          <th>Property</th>
          <th>Open</th>
          <th>In Progress</th>
          <th>Completed</th>
          <th>Total Cost</th>
        </tr>
      </thead>
      <tbody>
        ${data.requestsByProperty?.map(property => `
          <tr>
            <td>${property.name}</td>
            <td>${property.openRequests}</td>
            <td>${property.inProgressRequests}</td>
            <td>${property.completedRequests}</td>
            <td>$${property.totalCost?.toLocaleString() || 0}</td>
          </tr>
        `).join('') || '<tr><td colspan="5">No data available</td></tr>'}
      </tbody>
    </table>
  `;
};

// ---------------- EXPORT ----------------
const exportReport = async (req, res) => {
  try {
    const { type, format, dateRange, startDate, endDate, propertyId, tenantId } = req.query;
    const organizationId = req.user.organization_id;

    // This logic is duplicated here to ensure export can run independently
    let dateFilter = '';
    let dateParams = [];
    if (dateRange === 'custom' && startDate && endDate) {
      dateFilter = ' AND DATE(created_at) BETWEEN ? AND ?';
      dateParams = [startDate, endDate];
    } // ... other date logic would go here as in generateReports

    // FIX: Call the dedicated data fetching function instead of the whole controller.
    // This prevents the "headers already sent" error.
    const reportData = await getReportData(type, organizationId, dateFilter, dateParams, propertyId, tenantId);

    if (format === 'pdf') {
      const pdfBuffer = await generatePDFReport(type, reportData);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${type}-report.pdf"`);
      res.send(pdfBuffer);
    } else if (format === 'excel') {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${type}-report.xlsx"`);
      // In a real app, you would use a library like ExcelJS or SheetJS here
      res.send(`Excel generation for ${type} report would be implemented here.`);
    } else {
      res.status(400).json({ message: 'Invalid export format' });
    }
  } catch (error) {
    console.error('Export report error:', error);
    res.status(500).json({ message: 'Server error during export.' });
  }
};


module.exports = {
  generateReports,
  exportReport
};