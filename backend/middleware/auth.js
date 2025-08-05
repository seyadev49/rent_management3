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
      'SELECT u.*, o.subscription_status, o.trial_end_date FROM users u JOIN organizations o ON u.organization_id = o.id WHERE u.id = ? AND u.is_active = TRUE',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const user = users[0];

    // Check if organization is active and within trial/subscription period
    if (user.subscription_status === 'trial' && new Date() > new Date(user.trial_end_date)) {
      return res.status(403).json({ message: 'Trial period has expired' });
    }

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
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
};

module.exports = { authenticateToken, authorize };