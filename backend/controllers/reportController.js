const db = require('../db/connection');

// Main report generator
const generateReports = async (req, res) => {
  try {
    const { type, dateRange, startDate, endDate, propertyId, tenantId } = req.query;
    const organizationId = req.user.organization_id;

    // Build date filter
    let dateFilter = '';
    let dateParams = [];

    if (dateRange === 'custom' && startDate && endDate) {
      dateFilter = ' AND DATE(created_at) BETWEEN ? AND ?';
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

      dateFilter = ' AND DATE(created_at) >= ?';
      dateParams = [filterDate.toISOString().split('T')[0]];
    }

    let data = {};

    switch (type) {
      case 'financial':
        data = await generateFinancialReport(organizationId, dateFilter, dateParams, propertyId);
        break;
      case 'tenant':
        data = await generateTenantReport(organizationId, dateFilter, dateParams, tenantId);
        break;
      case 'property':
        data = await generatePropertyReport(organizationId, dateFilter, dateParams, propertyId);
        break;
      case 'maintenance':
        data = await generateMaintenanceReport(organizationId, dateFilter, dateParams, propertyId);
        break;
      default:
        return res.status(400).json({ message: 'Invalid report type' });
    }

    return data;
  } catch (error) {
    console.error('Generate reports error:', error);
    throw error; // Let exportReport handle the response
  }
};

// ---------------- FINANCIAL ----------------
const generateFinancialReport = async (organizationId, dateFilter, dateParams, propertyId) => {
  const propertyFilter = propertyId ? ' AND p.id = ?' : '';
  const propertyParams = propertyId ? [propertyId] : [];

  // Total collected
  const [collectedResult] = await db.execute(
    `SELECT COALESCE(SUM(amount),0) as total 
     FROM payments 
     WHERE organization_id = ? AND status = 'paid'${dateFilter}${propertyFilter}`,
    [organizationId, ...dateParams, ...propertyParams]
  );

  // Outstanding payments
  const [outstandingResult] = await db.execute(
    `SELECT COALESCE(SUM(amount),0) as total 
     FROM payments 
     WHERE organization_id = ? AND status IN ('pending', 'overdue')${propertyFilter}`,
    [organizationId, ...propertyParams]
  );

  // Security deposits
  const [depositsResult] = await db.execute(
    `SELECT COALESCE(SUM(deposit),0) as total 
     FROM rental_contracts 
     WHERE organization_id = ? AND status = 'active'${propertyFilter}`,
    [organizationId, ...propertyParams]
  );

  // Expenses
  const [expensesResult] = await db.execute(
    `SELECT COALESCE(SUM(actual_cost),0) as total 
     FROM maintenance_requests 
     WHERE organization_id = ? AND status = 'completed'${dateFilter}${propertyFilter}`,
    [organizationId, ...dateParams, ...propertyParams]
  );

  // Revenue by property
  const [revenueResult] = await db.execute(
    `SELECT p.name, p.id,
            COALESCE(SUM(CASE WHEN pay.status = 'paid' THEN pay.amount ELSE 0 END),0) as monthlyRevenue,
            COUNT(CASE WHEN rc.status = 'active' THEN 1 END) as occupiedUnits,
            p.total_units as totalUnits,
            ROUND((COUNT(CASE WHEN rc.status = 'active' THEN 1 END) / p.total_units) * 100, 2) as occupancyRate
     FROM properties p
     LEFT JOIN rental_contracts rc ON p.id = rc.property_id
     LEFT JOIN payments pay ON rc.id = pay.contract_id${dateFilter}
     WHERE p.organization_id = ?${propertyFilter}
     GROUP BY p.id, p.name, p.total_units`,
    [organizationId, ...dateParams, ...propertyParams]
  );

  return {
    financial: {
      totalCollected: collectedResult[0].total,
      outstanding: outstandingResult[0].total,
      securityDeposits: depositsResult[0].total,
      expenses: expensesResult[0].total,
      revenue: revenueResult
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
    `SELECT t.*, rc.contract_start_date, rc.contract_end_date, 
            p.name as property_name, pu.unit_number,
            COALESCE(SUM(CASE WHEN pay.status IN ('pending','overdue') THEN pay.amount ELSE 0 END),0) as outstanding_balance
     FROM tenants t
     LEFT JOIN rental_contracts rc ON t.id = rc.tenant_id AND rc.status = 'active'
     LEFT JOIN properties p ON rc.property_id = p.id
     LEFT JOIN property_units pu ON rc.unit_id = pu.id
     LEFT JOIN payments pay ON rc.id = pay.contract_id
     WHERE t.organization_id = ?${tenantFilter}
     GROUP BY t.id`,
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
    `SELECT COALESCE(AVG((occupied_units/total_units)*100),0) as occupancyRate
     FROM properties p
     WHERE p.organization_id = ?${propertyFilter}`,
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
    `SELECT p.name, p.total_units, p.occupied_units,
            COALESCE(SUM(CASE WHEN rc.status = 'active' THEN rc.monthly_rent ELSE 0 END),0) as monthlyIncome,
            COALESCE(SUM(pu.monthly_rent),0) as potentialIncome
     FROM properties p
     LEFT JOIN property_units pu ON p.id = pu.property_id
     LEFT JOIN rental_contracts rc ON pu.id = rc.unit_id AND rc.status = 'active'
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

  const [maintenanceStats] = await db.execute(
    `SELECT 
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as openRequests,
      COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as inProgressRequests,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completedRequests,
      AVG(CASE WHEN status = 'completed' AND completed_date IS NOT NULL THEN DATEDIFF(completed_date, requested_date) END) as avgResolutionTime
     FROM maintenance_requests mr
     WHERE mr.organization_id = ?${propertyFilter}`,
    [organizationId, ...propertyParams]
  );

  const [maintenanceByProperty] = await db.execute(
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
    const reportData = await generateReports(req, res);

    const { type, format } = req.query;

    if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${type}-report.pdf"`);
      res.send('PDF generation would be implemented here');
    } else if (format === 'excel') {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${type}-report.xlsx"`);
      res.send('Excel generation would be implemented here');
    } else {
      res.status(400).json({ message: 'Invalid export format' });
    }
  } catch (error) {
    console.error('Export report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  generateReports,
  exportReport
};
