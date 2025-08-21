
const db = require('../../db/connection');

// Get all organizations with their details
const getAllOrganizations = async (req, res) => {
  try {
    const [organizations] = await db.execute(`
      SELECT 
        o.id,
        o.name as organization_name,
        o.email,
        o.phone,
        o.address,
        o.created_at,
        o.subscription_plan,
        o.subscription_status,
        o.trial_end_date,
        COUNT(DISTINCT u.id) as total_users,
        COUNT(DISTINCT p.id) as total_properties,
        COUNT(DISTINCT t.id) as total_tenants,
        MAX(u.last_login) as last_activity
      FROM organizations o
      LEFT JOIN users u ON o.id = u.organization_id
      LEFT JOIN properties p ON o.id = p.organization_id
      LEFT JOIN tenants t ON o.id = t.organization_id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `);

    res.json(organizations);
  } catch (error) {
    console.error('Get all organizations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get detailed organization info with users
const getOrganizationDetails = async (req, res) => {
  try {
    const { orgId } = req.params;

    // Get organization info
    const [orgData] = await db.execute(`
      SELECT 
        o.*,
        COUNT(DISTINCT u.id) as total_users,
        COUNT(DISTINCT p.id) as total_properties,
        COUNT(DISTINCT t.id) as total_tenants,
        COUNT(DISTINCT c.id) as total_contracts,
        COALESCE(SUM(py.amount), 0) as total_payments_received
      FROM organizations o
      LEFT JOIN users u ON o.id = u.organization_id
      LEFT JOIN properties p ON o.id = p.organization_id
      LEFT JOIN tenants t ON o.id = t.organization_id
      LEFT JOIN contracts c ON o.id = c.organization_id
      LEFT JOIN payments py ON o.id = py.organization_id
      WHERE o.id = ?
      GROUP BY o.id
    `, [orgId]);

    if (orgData.length === 0) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    // Get organization users
    const [users] = await db.execute(`
      SELECT 
        id, name, email, role, last_login, created_at, is_active
      FROM users 
      WHERE organization_id = ?
      ORDER BY created_at DESC
    `, [orgId]);

    // Get recent activity logs
    const [activityLogs] = await db.execute(`
      SELECT 
        al.action, al.details, al.created_at, u.name as user_name
      FROM activity_logs al
      JOIN users u ON al.user_id = u.id
      WHERE al.organization_id = ?
      ORDER BY al.created_at DESC
      LIMIT 20
    `, [orgId]);

    res.json({
      organization: orgData[0],
      users,
      activityLogs
    });
  } catch (error) {
    console.error('Get organization details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user activity logs across all organizations
const getUserActivityLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, orgId, userId } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '';
    let params = [];

    if (orgId) {
      whereClause += ' WHERE al.organization_id = ?';
      params.push(orgId);
    }

    if (userId) {
      whereClause += orgId ? ' AND al.user_id = ?' : ' WHERE al.user_id = ?';
      params.push(userId);
    }

    const [logs] = await db.execute(`
      SELECT 
        al.id,
        al.action,
        al.details,
        al.created_at,
        u.name as user_name,
        u.email as user_email,
        o.name as organization_name
      FROM activity_logs al
      JOIN users u ON al.user_id = u.id
      JOIN organizations o ON al.organization_id = o.id
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    // Get total count
    const [countResult] = await db.execute(`
      SELECT COUNT(*) as total
      FROM activity_logs al
      ${whereClause}
    `, params);

    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Get user activity logs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Suspend/Reactivate organization
const toggleOrganizationStatus = async (req, res) => {
  try {
    const { orgId } = req.params;
    const { action, reason } = req.body; // action: 'suspend' | 'reactivate'

    const newStatus = action === 'suspend' ? 'suspended' : 'active';

    await db.execute(`
      UPDATE organizations 
      SET subscription_status = ?, 
          suspension_reason = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [newStatus, action === 'suspend' ? reason : null, orgId]);

    // Log the action
    await db.execute(`
      INSERT INTO admin_actions (admin_id, action, target_type, target_id, details)
      VALUES (?, ?, 'organization', ?, ?)
    `, [req.user.id, action, orgId, JSON.stringify({ reason })]);

    res.json({ 
      message: `Organization ${action === 'suspend' ? 'suspended' : 'reactivated'} successfully` 
    });
  } catch (error) {
    console.error('Toggle organization status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reset user password
const resetUserPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;

    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.execute(`
      UPDATE users 
      SET password = ?, 
          password_reset_required = TRUE,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [hashedPassword, userId]);

    // Log the action
    await db.execute(`
      INSERT INTO admin_actions (admin_id, action, target_type, target_id, details)
      VALUES (?, 'password_reset', 'user', ?, ?)
    `, [req.user.id, userId, JSON.stringify({ forced: true })]);

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset user password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Impersonate user (generate impersonation token)
const impersonateUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user details
    const [users] = await db.execute(`
      SELECT u.*, o.name as organization_name
      FROM users u
      JOIN organizations o ON u.organization_id = o.id
      WHERE u.id = ?
    `, [userId]);

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users[0];

    // Generate impersonation token
    const jwt = require('jsonwebtoken');
    const impersonationToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        organization_id: user.organization_id,
        organizationName: user.organization_name,
        impersonatedBy: req.user.id,
        isImpersonation: true
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Log the impersonation
    await db.execute(`
      INSERT INTO admin_actions (admin_id, action, target_type, target_id, details)
      VALUES (?, 'impersonate', 'user', ?, ?)
    `, [req.user.id, userId, JSON.stringify({ user_email: user.email })]);

    res.json({ 
      impersonationToken,
      userDetails: {
        id: user.id,
        name: user.name,
        email: user.email,
        organizationName: user.organization_name
      }
    });
  } catch (error) {
    console.error('Impersonate user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllOrganizations,
  getOrganizationDetails,
  getUserActivityLogs,
  toggleOrganizationStatus,
  resetUserPassword,
  impersonateUser
};
