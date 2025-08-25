const jwt = require('jsonwebtoken');
const db = require('../db/connection');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user details
    const [users] = await db.execute(
      'SELECT u.*, o.subscription_status, o.trial_end_date, o.next_renewal_date, o.overdue_since FROM users u JOIN organizations o ON u.organization_id = o.id WHERE u.id = ? AND u.is_active = TRUE',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const user = users[0];
    const today = new Date();

    // Check if trial has expired - allow basic access but mark as expired
    if (user.subscription_status === 'trial' && today > new Date(user.trial_end_date)) {
      user.subscription_status = 'expired_trial';
    }

    // Check if subscription is overdue - allow access but mark as overdue
    if (user.subscription_status === 'active' && user.next_renewal_date && today > new Date(user.next_renewal_date)) {
      // Mark as overdue if not already marked
      if (!user.overdue_since) {
        await db.execute(
          'UPDATE organizations SET subscription_status = "overdue", overdue_since = CURDATE() WHERE id = ?',
          [user.organization_id]
        );
      }
      user.subscription_status = 'overdue';
    }

    // Only block access for suspended or cancelled subscriptions
    if (user.subscription_status === 'suspended' || user.subscription_status === 'cancelled') {
      return res.status(403).json({ message: 'Subscription is not active' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
};

// Middleware to log user activity
const logActivity = (action) => {
  return async (req, res, next) => {
    try {
      if (req.user && req.user.id) {
        const db = require('../db/connection');

        const details = {
          method: req.method,
          url: req.url,
          body: req.method === 'POST' || req.method === 'PUT' ? req.body : null,
          params: req.params,
          query: req.query
        };

        await db.execute(
          `INSERT INTO activity_logs (user_id, organization_id, action, details, ip_address, user_agent) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            req.user.id,
            req.user.organization_id,
            action,
            JSON.stringify(details),
            req.ip || req.connection.remoteAddress,
            req.get('user-agent')
          ]
        );

        // Update user's last activity
        await db.execute(
          'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
          [req.user.id]
        );
      }
    } catch (error) {
      console.error('Activity logging error:', error);
      // Don't block the request if logging fails
    }
    next();
  };
};

module.exports = { authenticateToken, authorize, logActivity };