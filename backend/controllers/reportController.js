const db = require('../db/connection');

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

    // This logic creates a dynamic date filter based on user selection
    if (dateRange === 'custom' && startDate && endDate) {
      dateFilter = ' AND DATE(p.created_at) BETWEEN ? AND ?';
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
        default: // Default to 'month'
          filterDate = new Date(now);
          filterDate.setMonth(now.getMonth() - 1);
      }
      // Note: The date filter has been updated to reference a table alias 'p' or 'mr' etc.
      // This will be specified in each report function to avoid ambiguity.
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

    // Placeholder for actual file generation
    if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${type}-report.pdf"`);
      // In a real app, you would use a library like PDFKit or Puppeteer here
      res.send(`PDF generation for ${type} report would be implemented here.`);
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