const db = require('../db/connection');

const getSubscriptionPlans = async (req, res) => {
  try {
    const plans = [
      {
        id: 'basic',
        name: 'Basic Plan',
        price: 29.99,
        interval: 'month',
        features: [
          'Up to 10 properties',
          'Up to 50 tenants',
          'Basic payment tracking',
          'Email support'
        ]
      },
      {
        id: 'professional',
        name: 'Professional Plan',
        price: 59.99,
        interval: 'month',
        features: [
          'Up to 50 properties',
          'Up to 200 tenants',
          'Advanced payment tracking',
          'Maintenance management',
          'Document storage',
          'Priority support'
        ]
      },
      {
        id: 'enterprise',
        name: 'Enterprise Plan',
        price: 99.99,
        interval: 'month',
        features: [
          'Unlimited properties',
          'Unlimited tenants',
          'Full feature access',
          'Advanced reporting',
          'API access',
          '24/7 phone support'
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
    const { planId, paymentMethod } = req.body;

    // In a real implementation, you would integrate with a payment processor like Stripe
    // For now, we'll simulate the upgrade process

    const planPrices = {
      basic: 29.99,
      professional: 59.99,
      enterprise: 99.99
    };

    if (!planPrices[planId]) {
      return res.status(400).json({ message: 'Invalid plan selected' });
    }

    // Update organization subscription
    await db.execute(
      `UPDATE organizations 
       SET subscription_status = 'active', 
           subscription_plan = ?,
           subscription_price = ?,
           trial_end_date = DATE_ADD(CURDATE(), INTERVAL 30 DAY)
       WHERE id = ?`,
      [planId, planPrices[planId], req.user.organization_id]
    );

    // Create subscription record (you might want a separate subscriptions table)
    await db.execute(
      `INSERT INTO subscription_history (organization_id, plan_id, amount, payment_method, status) 
       VALUES (?, ?, ?, ?, 'active')`,
      [req.user.organization_id, planId, planPrices[planId], paymentMethod]
    );

    res.json({
      message: 'Subscription upgraded successfully',
      plan: planId,
      amount: planPrices[planId]
    });
  } catch (error) {
    console.error('Upgrade subscription error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getSubscriptionStatus = async (req, res) => {
  try {
    const [organizations] = await db.execute(
      `SELECT subscription_status, subscription_plan, subscription_price, trial_end_date 
       FROM organizations WHERE id = ?`,
      [req.user.organization_id]
    );

    if (organizations.length === 0) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    res.json({ subscription: organizations[0] });
  } catch (error) {
    console.error('Get subscription status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getSubscriptionPlans,
  upgradeSubscription,
  getSubscriptionStatus
};