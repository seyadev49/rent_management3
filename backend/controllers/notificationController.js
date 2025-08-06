const db = require('../db/connection');

const createNotification = async (req, res) => {
  try {
    const { userId, title, message, type, scheduledDate } = req.body;

    const [result] = await db.execute(
      `INSERT INTO notifications (organization_id, user_id, title, message, type, scheduled_date) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.organization_id, userId, title, message, type, scheduledDate]
    );

    res.status(201).json({
      message: 'Notification created successfully',
      notificationId: result.insertId
    });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getNotifications = async (req, res) => {
  try {
    const [notifications] = await db.execute(
      `SELECT * FROM notifications 
       WHERE user_id = ? AND organization_id = ?
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.user.id, req.user.organization_id]
    );

    res.json({ notifications });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    await db.execute(
      'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ? AND organization_id = ?',
      [id, req.user.id, req.user.organization_id]
    );

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    await db.execute(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND organization_id = ?',
      [req.user.id, req.user.organization_id]
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const [result] = await db.execute(
      'SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = ? AND organization_id = ? AND is_read = FALSE',
      [req.user.id, req.user.organization_id]
    );

    res.json({ unreadCount: result[0].unread_count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Auto-generate notifications for system events
const generateSystemNotifications = async () => {
  try {
    // Check for expiring contracts (within 30 days)
    const [expiringContracts] = await db.execute(`
      SELECT rc.*, u.id as landlord_id, t.full_name as tenant_name, p.name as property_name
      FROM rental_contracts rc
      JOIN users u ON rc.landlord_id = u.id
      JOIN tenants t ON rc.tenant_id = t.id
      JOIN properties p ON rc.property_id = p.id
      WHERE rc.status = 'active' 
      AND DATEDIFF(rc.contract_end_date, CURDATE()) <= 30 
      AND DATEDIFF(rc.contract_end_date, CURDATE()) >= 0
    `);

    for (const contract of expiringContracts) {
      // Check if notification already exists
      const [existing] = await db.execute(
        'SELECT id FROM notifications WHERE type = ? AND message LIKE ? AND user_id = ?',
        ['lease_expiry', `%${contract.tenant_name}%`, contract.landlord_id]
      );

      if (existing.length === 0) {
        await db.execute(
          `INSERT INTO notifications (organization_id, user_id, title, message, type) 
           VALUES (?, ?, ?, ?, ?)`,
          [
            contract.organization_id,
            contract.landlord_id,
            'Contract Expiring Soon',
            `Contract for ${contract.tenant_name} at ${contract.property_name} expires on ${new Date(contract.contract_end_date).toLocaleDateString()}`,
            'lease_expiry'
          ]
        );
      }
    }

    // Check for overdue payments
    const [overduePayments] = await db.execute(`
      SELECT p.*, rc.landlord_id, t.full_name as tenant_name, prop.name as property_name
      FROM payments p
      JOIN rental_contracts rc ON p.contract_id = rc.id
      JOIN tenants t ON p.tenant_id = t.id
      JOIN properties prop ON rc.property_id = prop.id
      WHERE p.status = 'overdue' AND p.due_date < CURDATE()
    `);

    for (const payment of overduePayments) {
      const [existing] = await db.execute(
        'SELECT id FROM notifications WHERE type = ? AND message LIKE ? AND user_id = ?',
        ['rent_due', `%${payment.tenant_name}%`, payment.landlord_id]
      );

      if (existing.length === 0) {
        await db.execute(
          `INSERT INTO notifications (organization_id, user_id, title, message, type) 
           VALUES (?, ?, ?, ?, ?)`,
          [
            payment.organization_id,
            payment.landlord_id,
            'Overdue Payment',
            `Payment of $${payment.amount} from ${payment.tenant_name} at ${payment.property_name} is overdue`,
            'rent_due'
          ]
        );
      }
    }

    console.log('System notifications generated successfully');
  } catch (error) {
    console.error('Generate system notifications error:', error);
  }
};

module.exports = {
  createNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  generateSystemNotifications
};