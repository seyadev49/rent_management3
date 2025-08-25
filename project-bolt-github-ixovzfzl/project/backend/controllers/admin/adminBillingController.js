
const db = require('../../db/connection');

// Get billing overview
const getBillingOverview = async (req, res) => {
  try {
    // Monthly Recurring Revenue
    const [mrrData] = await db.execute(`
      SELECT 
        COALESCE(SUM(CASE WHEN sh.billing_cycle = 'monthly' THEN sh.amount ELSE sh.amount/12 END), 0) as mrr
      FROM subscription_history sh
      WHERE sh.status = 'active'
    `);

    // Total revenue this month
    const [monthlyRevenue] = await db.execute(`
      SELECT COALESCE(SUM(amount), 0) as revenue
      FROM subscription_history
      WHERE MONTH(created_at) = MONTH(CURRENT_DATE())
      AND YEAR(created_at) = YEAR(CURRENT_DATE())
      AND status = 'active'
    `);

    // Active subscriptions by plan
    const [planBreakdown] = await db.execute(`
      SELECT 
        plan_id,
        COUNT(*) as count,
        SUM(amount) as total_revenue
      FROM subscription_history
      WHERE status = 'active'
      GROUP BY plan_id
    `);

    // Failed payments
    const [failedPayments] = await db.execute(`
      SELECT COUNT(*) as failed_count
      FROM subscription_history
      WHERE status = 'failed'
      AND DATE(created_at) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
    `);

    // Churn rate (organizations that cancelled in last 30 days)
    const [churnData] = await db.execute(`
      SELECT 
        (SELECT COUNT(*) FROM subscription_history WHERE status = 'cancelled' AND DATE(created_at) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)) as churned,
        (SELECT COUNT(*) FROM organizations WHERE subscription_status = 'active') as active_total
    `);

    const churnRate = churnData[0].active_total > 0 ? 
      (churnData[0].churned / churnData[0].active_total * 100).toFixed(2) : 0;

    res.json({
      mrr: mrrData[0].mrr,
      monthlyRevenue: monthlyRevenue[0].revenue,
      planBreakdown,
      failedPayments: failedPayments[0].failed_count,
      churnRate: parseFloat(churnRate)
    });
  } catch (error) {
    console.error('Get billing overview error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
// Get all subscriptions with details
const getAllSubscriptions = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, plan } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '';
    let params = [];

    if (status) {
      whereClause += ' WHERE sh.status = ?';
      params.push(status);
    }

    if (plan) {
      whereClause += status ? ' AND sh.plan_id = ?' : ' WHERE sh.plan_id = ?';
      params.push(plan);
    }

    // Subscriptions query (limit/offset interpolated, rest still parameterized)
    const [subscriptions] = await db.execute(`
      SELECT 
        sh.*,
        o.name as organization_name,
        o.email as organization_email,
        o.created_at as org_created_at
      FROM subscription_history sh
      JOIN organizations o ON sh.organization_id = o.id
      ${whereClause}
      ORDER BY sh.created_at DESC
      LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
    `, params);

    // Count query (still parameterized)
    const [countResult] = await db.execute(`
      SELECT COUNT(*) as total
      FROM subscription_history sh
      ${whereClause}
    `, params);

    res.json({
      subscriptions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Get all subscriptions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get organization billing details
const getOrganizationBilling = async (req, res) => {
  try {
    const { orgId } = req.params;

    // Current subscription
    const [currentSub] = await db.execute(`
      SELECT * FROM subscription_history
      WHERE organization_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `, [orgId]);

    // Subscription history
    const [subHistory] = await db.execute(`
      SELECT * FROM subscription_history
      WHERE organization_id = ?
      ORDER BY created_at DESC
    `, [orgId]);

    // Payment history (if you have a payments table for subscription payments)
    const [paymentHistory] = await db.execute(`
      SELECT * FROM payments
      WHERE organization_id = ? AND payment_type = 'subscription'
      ORDER BY created_at DESC
    `, [orgId]);

    // Usage statistics
    const [usageStats] = await db.execute(`
      SELECT 
        COUNT(DISTINCT p.id) as properties_count,
        COUNT(DISTINCT t.id) as tenants_count,
        COUNT(DISTINCT c.id) as contracts_count,
        COUNT(DISTINCT d.id) as documents_count
      FROM organizations o
      LEFT JOIN properties p ON o.id = p.organization_id
      LEFT JOIN tenants t ON o.id = t.organization_id  
      LEFT JOIN contracts c ON o.id = c.organization_id
      LEFT JOIN documents d ON o.id = d.organization_id
      WHERE o.id = ?
    `, [orgId]);

    res.json({
      currentSubscription: currentSub[0] || null,
      subscriptionHistory: subHistory,
      paymentHistory,
      usage: usageStats[0]
    });
  } catch (error) {
    console.error('Get organization billing error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update organization subscription
const updateOrganizationSubscription = async (req, res) => {
  try {
    const { orgId } = req.params;
    const { planId, amount, billingCycle, action } = req.body; // action: 'upgrade', 'downgrade', 'cancel'

    if (action === 'cancel') {
      // Cancel current subscription
      await db.execute(`
        UPDATE subscription_history 
        SET status = 'cancelled', end_date = CURRENT_DATE()
        WHERE organization_id = ? AND status = 'active'
      `, [orgId]);

      await db.execute(`
        UPDATE organizations 
        SET subscription_status = 'cancelled', subscription_plan = 'free'
        WHERE id = ?
      `, [orgId]);
    } else {
      // End current subscription
      await db.execute(`
        UPDATE subscription_history 
        SET status = 'expired', end_date = CURRENT_DATE()
        WHERE organization_id = ? AND status = 'active'
      `, [orgId]);

      // Create new subscription
      await db.execute(`
        INSERT INTO subscription_history (organization_id, plan_id, amount, billing_cycle, status, start_date, end_date)
        VALUES (?, ?, ?, ?, 'active', CURRENT_DATE(), DATE_ADD(CURRENT_DATE(), INTERVAL 1 MONTH))
      `, [orgId, planId, amount, billingCycle]);

      // Update organization
      await db.execute(`
        UPDATE organizations 
        SET subscription_status = 'active', subscription_plan = ?
        WHERE id = ?
      `, [planId, orgId]);
    }

    // Log the action
    await db.execute(`
      INSERT INTO admin_actions (admin_id, action, target_type, target_id, details)
      VALUES (?, ?, 'organization', ?, ?)
    `, [req.user.id, `subscription_${action}`, orgId, JSON.stringify({ planId, amount, billingCycle })]);

    res.json({ message: `Subscription ${action} completed successfully` });
  } catch (error) {
    console.error('Update organization subscription error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Generate billing reports
const generateBillingReport = async (req, res) => {
  try {
    const { startDate, endDate, reportType } = req.query;

    let query;
    let params = [startDate, endDate];

    switch (reportType) {
      case 'revenue':
        query = `
          SELECT 
            DATE(created_at) as date,
            SUM(amount) as daily_revenue,
            COUNT(*) as transactions
          FROM subscription_history
          WHERE DATE(created_at) BETWEEN ? AND ?
          AND status = 'active'
          GROUP BY DATE(created_at)
          ORDER BY date
        `;
        break;

      case 'churn':
        query = `
          SELECT 
            DATE(created_at) as date,
            COUNT(*) as churned_customers
          FROM subscription_history
          WHERE DATE(created_at) BETWEEN ? AND ?
          AND status = 'cancelled'
          GROUP BY DATE(created_at)
          ORDER BY date
        `;
        break;

      case 'plan_performance':
        query = `
          SELECT 
            plan_id,
            COUNT(*) as subscribers,
            SUM(amount) as total_revenue,
            AVG(amount) as avg_revenue
          FROM subscription_history
          WHERE DATE(created_at) BETWEEN ? AND ?
          AND status = 'active'
          GROUP BY plan_id
        `;
        break;

      default:
        return res.status(400).json({ message: 'Invalid report type' });
    }

    const [reportData] = await db.execute(query, params);

    res.json({
      reportType,
      dateRange: { startDate, endDate },
      data: reportData
    });
  } catch (error) {
    console.error('Generate billing report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getBillingOverview,
  getAllSubscriptions,
  getOrganizationBilling,
  updateOrganizationSubscription,
  generateBillingReport
};
