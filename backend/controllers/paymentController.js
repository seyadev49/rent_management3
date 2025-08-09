const db = require('../db/connection');

const createPayment = async (req, res) => {
  try {
    const {
      contractId,
      tenantId,
      amount,
      paymentDate,
      dueDate,
      paymentType = 'rent',
      paymentMethod = 'cash',
      notes
    } = req.body;

    // Verify contract belongs to organization
    const [contracts] = await db.execute(
      'SELECT id FROM rental_contracts WHERE id = ? AND organization_id = ?',
      [contractId, req.user.organization_id]
    );

    if (contracts.length === 0) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    const [result] = await db.execute(
      `INSERT INTO payments (organization_id, contract_id, tenant_id, amount, payment_date, due_date, payment_type, payment_method, status, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'paid', ?)`,
      [req.user.organization_id, contractId, tenantId, amount, paymentDate, dueDate, paymentType, paymentMethod, notes]
    );

    // Clean up any auto-generated overdue payments for the same period
    if (paymentType === 'rent') {
      const paymentDueDate = new Date(dueDate);
      await cleanupOverduePayments(contractId, paymentDueDate.getMonth() + 1, paymentDueDate.getFullYear());
    }

    res.status(201).json({
      message: 'Payment recorded successfully',
      paymentId: result.insertId
    });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getPayments = async (req, res) => {
  try {
    const { status, tenantId, propertyId, startDate, endDate } = req.query;
    
    let query = `
      SELECT p.*, t.full_name as tenant_name, prop.name as property_name, pu.unit_number,
             rc.monthly_rent as contract_rent
      FROM payments p
      JOIN tenants t ON p.tenant_id = t.id
      JOIN rental_contracts rc ON p.contract_id = rc.id
      JOIN properties prop ON rc.property_id = prop.id
      JOIN property_units pu ON rc.unit_id = pu.id
      WHERE p.organization_id = ?
    `;
    
    const params = [req.user.organization_id];
    
    if (status) {
      query += ' AND p.status = ?';
      params.push(status);
    }
    
    if (tenantId) {
      query += ' AND p.tenant_id = ?';
      params.push(tenantId);
    }
    
    if (propertyId) {
      query += ' AND rc.property_id = ?';
      params.push(propertyId);
    }
    
    if (startDate) {
      query += ' AND p.payment_date >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      query += ' AND p.payment_date <= ?';
      params.push(endDate);
    }
    
    query += ' ORDER BY p.payment_date DESC';
    
    const [payments] = await db.execute(query, params);
    
    res.json({ payments });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!id || !status) {
      return res.status(400).json({ message: 'Payment ID and status are required' });
    }

    await db.execute(
      'UPDATE payments SET status = ?, notes = ? WHERE id = ? AND organization_id = ?',
      [
        status,
        notes !== undefined ? notes : null,
        id,
        req.user?.organization_id ?? null
      ]
    );

    res.json({ message: 'Payment status updated successfully' });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deletePayment = async (req, res) => {
  try {
    const { id } = req.params;

    await db.execute(
      'DELETE FROM payments WHERE id = ? AND organization_id = ?',
      [id, req.user.organization_id]
    );

    res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    console.error('Delete payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const generateOverduePayments = async (req, res) => {
  try {
    // Get all active contracts
    const [contracts] = await db.execute(
      `SELECT rc.*, t.id as tenant_id, t.full_name as tenant_name
       FROM rental_contracts rc
       JOIN tenants t ON rc.tenant_id = t.id
       WHERE rc.organization_id = ? AND rc.status = 'active'`,
      [req.user.organization_id]
    );

    const overduePayments = [];
    const today = new Date();

    for (const contract of contracts) {
      // Check for each month since contract start until current month
      const startDate = new Date(contract.contract_start_date);
      const endDate = new Date(Math.min(today.getTime(), new Date(contract.contract_end_date).getTime()));
      
      let currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      
      while (currentDate <= endDate) {
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();
        
        // Check if payment already exists for this month
        const [existingPayments] = await db.execute(
          `SELECT id, status FROM payments 
           WHERE contract_id = ? AND MONTH(due_date) = ? AND YEAR(due_date) = ?`,
          [contract.id, currentMonth, currentYear]
        );

        // Only create overdue record if no payment exists and due date has passed
        if (existingPayments.length === 0) {
          const dueDate = new Date(currentYear, currentMonth - 1, contract.payment_due_day || 1);
          
          if (dueDate < today) {
            const [result] = await db.execute(
              `INSERT INTO payments (organization_id, contract_id, tenant_id, amount, payment_date, due_date, payment_type, status, notes) 
               VALUES (?, ?, ?, ?, NULL, ?, 'rent', 'overdue', 'Auto-generated overdue payment')`,
              [req.user.organization_id, contract.id, contract.tenant_id, contract.monthly_rent, dueDate]
            );
            
            overduePayments.push({
              id: result.insertId,
              tenant_name: contract.tenant_name,
              amount: contract.monthly_rent,
              due_date: dueDate,
              month: `${currentYear}-${currentMonth.toString().padStart(2, '0')}`
            });
          }
        }
        
        // Move to next month
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    }

    res.json({ 
      message: `Generated ${overduePayments.length} overdue payment records`,
      overduePayments 
    });
  } catch (error) {
    console.error('Generate overdue payments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Function to clean up overdue payments when a payment is made
const cleanupOverduePayments = async (contractId, paymentMonth, paymentYear) => {
  try {
    // Remove any auto-generated overdue payments for the same period
    await db.execute(
      `DELETE FROM payments 
       WHERE contract_id = ? 
       AND MONTH(due_date) = ? 
       AND YEAR(due_date) = ? 
       AND status = 'overdue' 
       AND notes = 'Auto-generated overdue payment'`,
      [contractId, paymentMonth, paymentYear]
    );
  } catch (error) {
    console.error('Cleanup overdue payments error:', error);
  }
};

module.exports = {
  createPayment,
  getPayments,
  updatePaymentStatus,
  deletePayment,
  generateOverduePayments,
  cleanupOverduePayments
};