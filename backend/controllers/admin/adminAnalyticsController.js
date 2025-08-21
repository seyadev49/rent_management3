
const db = require('../../db/connection');

// Get platform overview statistics
const getPlatformOverview = async (req, res) => {
  try {
    // Total registered organizations
    const [totalOrgs] = await db.execute(`
      SELECT COUNT(*) as total FROM organizations
    `);

    // Active organizations
    const [activeOrgs] = await db.execute(`
      SELECT COUNT(*) as active FROM organizations 
      WHERE subscription_status = 'active'
    `);

    // Trial organizations
    const [trialOrgs] = await db.execute(`
      SELECT COUNT(*) as trial FROM organizations 
      WHERE subscription_status = 'trial'
    `);

    // Total users across all organizations
    const [totalUsers] = await db.execute(`
      SELECT COUNT(*) as total FROM users
    `);

    // Total properties managed
    const [totalProperties] = await db.execute(`
      SELECT COUNT(*) as total FROM properties
    `);

    // Total tenants
    const [totalTenants] = await db.execute(`
      SELECT COUNT(*) as total FROM tenants
    `);

    // Total rent transactions processed
    const [totalTransactions] = await db.execute(`
      SELECT 
        COUNT(*) as total_transactions,
        COALESCE(SUM(amount), 0) as total_amount
      FROM payments
    `);

    // Monthly Recurring Revenue
    const [mrrData] = await db.execute(`
      SELECT 
        COALESCE(SUM(CASE WHEN sh.billing_cycle = 'monthly' THEN sh.amount ELSE sh.amount/12 END), 0) as mrr
      FROM subscription_history sh
      WHERE sh.status = 'active'
    `);

    // Growth metrics (new organizations this month vs last month)
    const [growthData] = await db.execute(`
      SELECT 
        SUM(CASE WHEN MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE()) THEN 1 ELSE 0 END) as this_month,
        SUM(CASE WHEN MONTH(created_at) = MONTH(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH)) AND YEAR(created_at) = YEAR(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH)) THEN 1 ELSE 0 END) as last_month
      FROM organizations
    `);

    const growthRate = growthData[0].last_month > 0 ? 
      ((growthData[0].this_month - growthData[0].last_month) / growthData[0].last_month * 100).toFixed(2) : 0;

    res.json({
      overview: {
        totalOrganizations: totalOrgs[0].total,
        activeOrganizations: activeOrgs[0].active,
        trialOrganizations: trialOrgs[0].trial,
        totalUsers: totalUsers[0].total,
        totalProperties: totalProperties[0].total,
        totalTenants: totalTenants[0].total,
        totalTransactions: totalTransactions[0].total_transactions,
        totalTransactionAmount: totalTransactions[0].total_amount,
        monthlyRecurringRevenue: mrrData[0].mrr,
        growthRate: parseFloat(growthRate)
      }
    });
  } catch (error) {
    console.error('Get platform overview error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user engagement analytics
const getUserEngagement = async (req, res) => {
  try {
    // Daily active users (last 30 days)
    const [dailyActiveUsers] = await db.execute(`
      SELECT 
        DATE(last_login) as date,
        COUNT(DISTINCT id) as active_users
      FROM users
      WHERE last_login >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
      GROUP BY DATE(last_login)
      ORDER BY date DESC
    `);

    // Most active organizations
    const [mostActiveOrgs] = await db.execute(`
      SELECT 
        o.name,
        o.id,
        COUNT(al.id) as activity_count,
        MAX(al.created_at) as last_activity
      FROM organizations o
      LEFT JOIN activity_logs al ON o.id = al.organization_id
      WHERE al.created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
      GROUP BY o.id, o.name
      ORDER BY activity_count DESC
      LIMIT 10
    `);

    // Feature usage statistics
    const [featureUsage] = await db.execute(`
      SELECT 
        action,
        COUNT(*) as usage_count
      FROM activity_logs
      WHERE created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
      GROUP BY action
      ORDER BY usage_count DESC
    `);

    res.json({
      dailyActiveUsers,
      mostActiveOrganizations: mostActiveOrgs,
      featureUsage
    });
  } catch (error) {
    console.error('Get user engagement error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get revenue analytics
const getRevenueAnalytics = async (req, res) => {
  try {
    const { period = '30' } = req.query; // days

    // Revenue by day
    const [dailyRevenue] = await db.execute(`
      SELECT 
        DATE(created_at) as date,
        SUM(amount) as revenue,
        COUNT(*) as transactions
      FROM subscription_history
      WHERE created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL ? DAY)
      AND status = 'active'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `, [parseInt(period)]);

    // Revenue by plan
    const [revenueByPlan] = await db.execute(`
      SELECT 
        plan_id,
        SUM(amount) as total_revenue,
        COUNT(*) as subscribers,
        AVG(amount) as avg_revenue
      FROM subscription_history
      WHERE status = 'active'
      GROUP BY plan_id
    `);

    // Customer Lifetime Value (simple calculation)
    const [clvData] = await db.execute(`
      SELECT 
        AVG(total_revenue) as avg_clv
      FROM (
        SELECT 
          organization_id,
          SUM(amount) as total_revenue
        FROM subscription_history
        GROUP BY organization_id
      ) as customer_revenue
    `);

    res.json({
      dailyRevenue,
      revenueByPlan,
      averageCustomerLifetimeValue: clvData[0].avg_clv || 0
    });
  } catch (error) {
    console.error('Get revenue analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get system performance metrics
const getSystemPerformance = async (req, res) => {
  try {
    // Database performance metrics
    const [dbStats] = await db.execute(`
      SELECT 
        table_name,
        table_rows,
        data_length,
        index_length
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
      ORDER BY data_length DESC
    `);

    // Error logs (if you have an error_logs table)
    const [errorStats] = await db.execute(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as error_count
      FROM activity_logs
      WHERE action LIKE '%error%' OR action LIKE '%failed%'
      AND created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    // Top organizations by resource usage
    const [resourceUsage] = await db.execute(`
      SELECT 
        o.name,
        COUNT(DISTINCT p.id) as properties_count,
        COUNT(DISTINCT t.id) as tenants_count,
        COUNT(DISTINCT d.id) as documents_count,
        COUNT(DISTINCT py.id) as payments_count
      FROM organizations o
      LEFT JOIN properties p ON o.id = p.organization_id
      LEFT JOIN tenants t ON o.id = t.organization_id
      LEFT JOIN documents d ON o.id = d.organization_id
      LEFT JOIN payments py ON o.id = py.organization_id
      GROUP BY o.id, o.name
      ORDER BY (COUNT(DISTINCT p.id) + COUNT(DISTINCT t.id) + COUNT(DISTINCT d.id)) DESC
      LIMIT 10
    `);

    res.json({
      databaseStats: dbStats,
      errorStats,
      topResourceUsers: resourceUsage
    });
  } catch (error) {
    console.error('Get system performance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get geographic distribution of organizations
const getGeographicDistribution = async (req, res) => {
  try {
    const [geoData] = await db.execute(`
      SELECT 
        SUBSTRING_INDEX(address, ',', -1) as region,
        COUNT(*) as organization_count
      FROM organizations
      WHERE address IS NOT NULL AND address != ''
      GROUP BY region
      ORDER BY organization_count DESC
    `);

    res.json({ geographicDistribution: geoData });
  } catch (error) {
    console.error('Get geographic distribution error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getPlatformOverview,
  getUserEngagement,
  getRevenueAnalytics,
  getSystemPerformance,
  getGeographicDistribution
};
