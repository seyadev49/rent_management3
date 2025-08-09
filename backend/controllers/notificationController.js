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

// Enhanced auto-generate notifications for system events
const generateSystemNotifications = async () => {
  try {
    // 1. Check for lease renewals (60 and 30 days before expiry)
    const [contractsExpiring60] = await db.execute(`
      SELECT rc.*, u.id as landlord_id, t.full_name as tenant_name, p.name as property_name,
             DATEDIFF(rc.contract_end_date, CURDATE()) as days_left
      FROM rental_contracts rc
      JOIN users u ON rc.landlord_id = u.id
      JOIN tenants t ON rc.tenant_id = t.id
      JOIN properties p ON rc.property_id = p.id
      WHERE rc.status = 'active' 
      AND DATEDIFF(rc.contract_end_date, CURDATE()) IN (60, 30)
    `);

    for (const contract of contractsExpiring60) {
      const notificationType = contract.days_left === 60 ? 'lease_renewal_60' : 'lease_renewal_30';
      const [existing] = await db.execute(
        'SELECT id FROM notifications WHERE type = ? AND message LIKE ? AND user_id = ? AND DATE(created_at) = CURDATE()',
        [notificationType, `%${contract.tenant_name}%`, contract.landlord_id]
      );

      if (existing.length === 0) {
        await db.execute(
          `INSERT INTO notifications (organization_id, user_id, title, message, type) 
           VALUES (?, ?, ?, ?, ?)`,
          [
            contract.organization_id,
            contract.landlord_id,
            contract.days_left === 60 ? 'Lease Renewal Due Soon' : 'Lease Expires in 30 Days',
            `Contract for ${contract.tenant_name} at ${contract.property_name} expires in ${contract.days_left} days. Consider initiating renewal process.`,
            notificationType
          ]
        );
      }
    }

    // 2. Check for payments due in 3 days
    const [paymentsDueSoon] = await db.execute(`
      SELECT p.*, rc.landlord_id, t.full_name as tenant_name, prop.name as property_name,
             DATEDIFF(p.due_date, CURDATE()) as days_left
      FROM payments p
      JOIN rental_contracts rc ON p.contract_id = rc.id
      JOIN tenants t ON p.tenant_id = t.id
      JOIN properties prop ON rc.property_id = prop.id
      WHERE p.status = 'pending' 
      AND DATEDIFF(p.due_date, CURDATE()) = 3
    `);

    for (const payment of paymentsDueSoon) {
      const [existing] = await db.execute(
        'SELECT id FROM notifications WHERE type = ? AND message LIKE ? AND user_id = ? AND DATE(created_at) = CURDATE()',
        ['payment_reminder', `%${payment.tenant_name}%`, payment.landlord_id]
      );

      if (existing.length === 0) {
        await db.execute(
          `INSERT INTO notifications (organization_id, user_id, title, message, type) 
           VALUES (?, ?, ?, ?, ?)`,
          [
            payment.organization_id,
            payment.landlord_id,
            'Payment Due Soon',
            `Payment of $${payment.amount} from ${payment.tenant_name} at ${payment.property_name} is due in 3 days (${new Date(payment.due_date).toLocaleDateString()})`,
            'payment_reminder'
          ]
        );
      }
    }

    // 3. Check for payments due today
    const [paymentsDueToday] = await db.execute(`
      SELECT p.*, rc.landlord_id, t.full_name as tenant_name, prop.name as property_name
      FROM payments p
      JOIN rental_contracts rc ON p.contract_id = rc.id
      JOIN tenants t ON p.tenant_id = t.id
      JOIN properties prop ON rc.property_id = prop.id
      WHERE p.status = 'pending' 
      AND DATE(p.due_date) = CURDATE()
    `);

    for (const payment of paymentsDueToday) {
      const [existing] = await db.execute(
        'SELECT id FROM notifications WHERE type = ? AND message LIKE ? AND user_id = ? AND DATE(created_at) = CURDATE()',
        ['payment_due_today', `%${payment.tenant_name}%`, payment.landlord_id]
      );

      if (existing.length === 0) {
        await db.execute(
          `INSERT INTO notifications (organization_id, user_id, title, message, type) 
           VALUES (?, ?, ?, ?, ?)`,
          [
            payment.organization_id,
            payment.landlord_id,
            'Payment Due Today',
            `Payment of $${payment.amount} from ${payment.tenant_name} at ${payment.property_name} is due today`,
            'payment_due_today'
          ]
        );
      }
    }

    // 4. Check for overdue payments
    const [overduePayments] = await db.execute(`
      SELECT p.*, rc.landlord_id, t.full_name as tenant_name, prop.name as property_name,
             DATEDIFF(CURDATE(), p.due_date) as days_overdue
      FROM payments p
      JOIN rental_contracts rc ON p.contract_id = rc.id
      JOIN tenants t ON p.tenant_id = t.id
      JOIN properties prop ON rc.property_id = prop.id
      WHERE p.status = 'overdue' 
      AND p.due_date < CURDATE()
    `);

    for (const payment of overduePayments) {
      // Only send overdue notification once per day
      const [existing] = await db.execute(
        'SELECT id FROM notifications WHERE type = ? AND message LIKE ? AND user_id = ? AND DATE(created_at) = CURDATE()',
        ['rent_overdue', `%${payment.tenant_name}%`, payment.landlord_id]
      );

      if (existing.length === 0) {
        await db.execute(
          `INSERT INTO notifications (organization_id, user_id, title, message, type) 
           VALUES (?, ?, ?, ?, ?)`,
          [
            payment.organization_id,
            payment.landlord_id,
            'Payment Overdue',
            `Payment of $${payment.amount} from ${payment.tenant_name} at ${payment.property_name} is ${payment.days_overdue} day(s) overdue`,
            'rent_overdue'
          ]
        );
      }
    }

    console.log('Enhanced system notifications generated successfully');
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