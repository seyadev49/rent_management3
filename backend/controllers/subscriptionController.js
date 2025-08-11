const db = require('../db/connection');

const getSubscriptionPlans = async (req, res) => {
  try {
    const plans = [
      {
        id: 'basic',
        name: 'Basic Plan',
        price: 29.99,
        interval: 'month',
        limits: {
          properties: 3,
          tenants: 50,
          documents: 100,
          maintenance_requests: 50
        },
        features: [
          'Up to 3 properties',
          'Up to 50 tenants',
          'Basic payment tracking',
          'Email support',
          'Document storage (100 files)',
          'Basic maintenance tracking'
        ]
      },
      {
        id: 'professional',
        name: 'Professional Plan',
        price: 59.99,
        interval: 'month',
        limits: {
          properties: 20,
          tenants: 200,
          documents: 500,
          maintenance_requests: 200
        },
        features: [
          'Up to 20 properties',
          'Up to 200 tenants',
          'Advanced payment tracking',
          'Maintenance management',
          'Document storage (500 files)',
          'Priority support',
          'Advanced reporting'
        ]
      },
      {
        id: 'enterprise',
        name: 'Enterprise Plan',
        price: 99.99,
        interval: 'month',
        limits: {
          properties: -1, // unlimited
          tenants: -1, // unlimited
          documents: -1, // unlimited
          maintenance_requests: -1 // unlimited
        },
        features: [
          'Unlimited properties',
          'Unlimited tenants',
          'Full feature access',
          'Advanced reporting',
          'Unlimited document storage',
          '24/7 phone support',
          'Custom integrations'
        ]
      }
    ];

    res.json({ plans });
  } catch (error) {
    console.error('Get subscription plans error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const upgradeSubscription = async (req, res) => {
  try {
    const { planId, paymentMethod, billingCycle = 'monthly' } = req.body;

    const planPrices = {
      basic: { monthly: 29.99, annual: 299.99, 'semi-annual': 149.99 },
      professional: { monthly: 59.99, annual: 599.99, 'semi-annual': 299.99 },
      enterprise: { monthly: 99.99, annual: 999.99, 'semi-annual': 499.99 }
    };

    if (!planPrices[planId] || !planPrices[planId][billingCycle]) {
      return res.status(400).json({ message: 'Invalid plan or billing cycle selected' });
    }

    const price = planPrices[planId][billingCycle];
    
    // Calculate next renewal date based on billing cycle
    const currentDate = new Date();
    let nextRenewalDate = new Date(currentDate);
    
    switch (billingCycle) {
      case 'monthly':
        nextRenewalDate.setMonth(nextRenewalDate.getMonth() + 1);
        break;
      case 'semi-annual':
        nextRenewalDate.setMonth(nextRenewalDate.getMonth() + 6);
        break;
      case 'annual':
        nextRenewalDate.setFullYear(nextRenewalDate.getFullYear() + 1);
        break;
    }

    // Update organization subscription
    await db.execute(
      `UPDATE organizations 
       SET subscription_status = 'active', 
           subscription_plan = ?,
           subscription_price = ?,
           billing_cycle = ?,
           next_renewal_date = ?,
           trial_end_date = ?
       WHERE id = ?`,
      [planId, price, billingCycle, nextRenewalDate, nextRenewalDate, req.user.organization_id]
    );

    // Create subscription record
    await db.execute(
      `INSERT INTO subscription_history (organization_id, plan_id, amount, payment_method, billing_cycle, status, start_date, end_date) 
       VALUES (?, ?, ?, ?, ?, 'active', CURDATE(), ?)`,
      [req.user.organization_id, planId, price, paymentMethod, billingCycle, nextRenewalDate]
    );

    res.json({
      message: 'Subscription upgraded successfully',
      plan: planId,
      amount: price,
      billingCycle,
      nextRenewalDate
    });
  } catch (error) {
    console.error('Upgrade subscription error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const renewSubscription = async (req, res) => {
  try {
    const { paymentMethod } = req.body;

    // Get current subscription details
    const [organizations] = await db.execute(
      `SELECT subscription_plan, subscription_price, billing_cycle, next_renewal_date 
       FROM organizations WHERE id = ?`,
      [req.user.organization_id]
    );

    if (organizations.length === 0) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    const org = organizations[0];
    
    // Calculate next renewal date
    const currentRenewalDate = new Date(org.next_renewal_date);
    let nextRenewalDate = new Date(currentRenewalDate);
    
    switch (org.billing_cycle) {
      case 'monthly':
        nextRenewalDate.setMonth(nextRenewalDate.getMonth() + 1);
        break;
      case 'semi-annual':
        nextRenewalDate.setMonth(nextRenewalDate.getMonth() + 6);
        break;
      case 'annual':
        nextRenewalDate.setFullYear(nextRenewalDate.getFullYear() + 1);
        break;
    }

    // Update organization subscription status
    await db.execute(
      `UPDATE organizations 
       SET subscription_status = 'active',
           next_renewal_date = ?,
           overdue_since = NULL
       WHERE id = ?`,
      [nextRenewalDate, req.user.organization_id]
    );

    // Create renewal record
    await db.execute(
      `INSERT INTO subscription_history (organization_id, plan_id, amount, payment_method, billing_cycle, status, start_date, end_date) 
       VALUES (?, ?, ?, ?, ?, 'active', CURDATE(), ?)`,
      [req.user.organization_id, org.subscription_plan, org.subscription_price, paymentMethod, org.billing_cycle, nextRenewalDate]
    );

    res.json({
      message: 'Subscription renewed successfully',
      nextRenewalDate
    });
  } catch (error) {
    console.error('Renew subscription error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getSubscriptionStatus = async (req, res) => {
  try {
    const [organizations] = await db.execute(
      `SELECT subscription_status, subscription_plan, subscription_price, billing_cycle, 
              next_renewal_date, trial_end_date, overdue_since
       FROM organizations WHERE id = ?`,
      [req.user.organization_id]
    );

    if (organizations.length === 0) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    const subscription = organizations[0];
    
    // Calculate days until renewal
    let daysUntilRenewal = null;
    if (subscription.next_renewal_date) {
      const today = new Date();
      const renewalDate = new Date(subscription.next_renewal_date);
      daysUntilRenewal = Math.ceil((renewalDate - today) / (1000 * 60 * 60 * 24));
    }

    res.json({ 
      subscription: {
        ...subscription,
        daysUntilRenewal
      }
    });
  } catch (error) {
    console.error('Get subscription status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const checkPlanLimits = async (req, res) => {
  try {
    const { feature } = req.params;
    
    // Get current subscription
    const [organizations] = await db.execute(
      `SELECT subscription_plan, subscription_status FROM organizations WHERE id = ?`,
      [req.user.organization_id]
    );

    if (organizations.length === 0) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    const org = organizations[0];
    
    // Check if subscription is active
    if (org.subscription_status !== 'active' && org.subscription_status !== 'trial') {
      return res.status(403).json({ 
        message: 'Subscription required',
        canAccess: false,
        reason: 'inactive_subscription'
      });
    }

    // Get plan limits
    const planLimits = {
      basic: { properties: 3, tenants: 50, documents: 100, maintenance_requests: 50 },
      professional: { properties: 20, tenants: 200, documents: 500, maintenance_requests: 200 },
      enterprise: { properties: -1, tenants: -1, documents: -1, maintenance_requests: -1 }
    };

    const currentLimits = planLimits[org.subscription_plan] || planLimits.basic;
    
    // Get current usage
    const [propertiesCount] = await db.execute(
      'SELECT COUNT(*) as count FROM properties WHERE organization_id = ? AND is_active = TRUE',
      [req.user.organization_id]
    );
    
    const [tenantsCount] = await db.execute(
      'SELECT COUNT(*) as count FROM tenants WHERE organization_id = ? AND is_active = TRUE',
      [req.user.organization_id]
    );
    
    const [documentsCount] = await db.execute(
      'SELECT COUNT(*) as count FROM documents WHERE organization_id = ? AND is_active = TRUE',
      [req.user.organization_id]
    );
    
    const [maintenanceCount] = await db.execute(
      'SELECT COUNT(*) as count FROM maintenance_requests WHERE organization_id = ?',
      [req.user.organization_id]
    );

    const currentUsage = {
      properties: propertiesCount[0].count,
      tenants: tenantsCount[0].count,
      documents: documentsCount[0].count,
      maintenance_requests: maintenanceCount[0].count
    };

    // Check if feature is allowed and within limits
    const limit = currentLimits[feature];
    const usage = currentUsage[feature];
    
    const canAccess = limit === -1 || usage < limit;
    
    res.json({
      canAccess,
      currentUsage: usage,
      limit: limit === -1 ? 'unlimited' : limit,
      plan: org.subscription_plan,
      reason: canAccess ? null : 'limit_exceeded'
    });
  } catch (error) {
    console.error('Check plan limits error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getSubscriptionPlans,
  upgradeSubscription,
  renewSubscription,
  getSubscriptionStatus,
  checkPlanLimits
};