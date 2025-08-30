const db = require('../db/connection');

const createTenant = async (req, res) => {
  try {
    const {
      tenantId,
      fullName,
      sex,
      phone,
      city,
      subcity,
      woreda,
      houseNo,
      organization,
      hasAgent,
      agentFullName,
      agentSex,
      agentPhone,
      agentCity,
      agentSubcity,
      agentWoreda,
      agentHouseNo,
      authenticationNo,
      authenticationDate
    } = req.body;

    const [result] = await db.execute(
      `INSERT INTO tenants (
        organization_id, tenant_id, full_name, sex, phone, city, subcity, woreda, house_no, organization,
        has_agent, agent_full_name, agent_sex, agent_phone, agent_city, agent_subcity, agent_woreda,
        agent_house_no, authentication_no, authentication_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.organization_id,
        tenantId,
        fullName,
        sex,
        phone,
        city,
        subcity,
        woreda,
        houseNo,
        organization,
        hasAgent || false,
        agentFullName,
        agentSex,
        agentPhone,
        agentCity,
        agentSubcity,
        agentWoreda,
        agentHouseNo,
        authenticationNo,
        authenticationDate && authenticationDate.trim() !== '' ? authenticationDate : null
      ]
    );

    res.status(201).json({
      message: 'Tenant created successfully',
      tenantId: result.insertId
    });
  } catch (error) {
    console.error('Create tenant error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getTenants = async (req, res) => {
  try {
    const [tenants] = await db.execute(
      `SELECT t.*, 
              rc.id as contract_id,
              p.name as property_name,
              pu.unit_number,
              rc.monthly_rent,
              rc.contract_start_date,
              rc.contract_end_date,
              rc.status as contract_status,
              DATEDIFF(rc.contract_end_date, CURDATE()) as days_until_expiry,
              (SELECT MIN(DATEDIFF(pay.due_date, CURDATE())) 
               FROM payments pay 
               WHERE pay.contract_id = rc.id AND pay.status IN ('pending', 'overdue') 
               AND pay.due_date >= CURDATE()) as days_until_next_payment
       FROM tenants t
       LEFT JOIN rental_contracts rc ON t.id = rc.tenant_id AND rc.status = 'active'
       LEFT JOIN properties p ON rc.property_id = p.id
       LEFT JOIN property_units pu ON rc.unit_id = pu.id
       WHERE t.organization_id = ? AND t.is_active = TRUE
       ORDER BY t.created_at DESC`,
      [req.user.organization_id]
    );

    res.json({ tenants });
  } catch (error) {
    console.error('Get tenants error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getTenantById = async (req, res) => {
  try {
    const { id } = req.params;

    const [tenants] = await db.execute(
      'SELECT * FROM tenants WHERE id = ? AND organization_id = ?',
      [id, req.user.organization_id]
    );

    if (tenants.length === 0) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    res.json({ tenant: tenants[0] });
  } catch (error) {
    console.error('Get tenant error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getSecurityDeposit = (req, res) => {
  const tenantId = req.params.id; // this is tenants.id

  const query = `
    SELECT rc.deposit, pu.deposit as unit_deposit
    FROM rental_contracts rc
    JOIN property_units pu ON rc.unit_id = pu.id
    WHERE rc.tenant_id = ? AND rc.status = 'active'
    LIMIT 1
  `;

  db.execute(query, [tenantId])
    .then(([results]) => {
      if (results.length === 0) {
        console.log('[getSecurityDeposit] No deposit found for tenant:', tenantId);
        return res.json({ securityDeposit: null });
      }

      const deposit = results[0].deposit || results[0].unit_deposit;
      console.log('[getSecurityDeposit] Found deposit:', deposit);
      return res.json({ securityDeposit: deposit });
    })
    .catch((err) => {
      console.error('[getSecurityDeposit] DB error:', err);
      return res.status(500).json({ message: 'Database error' });
    });
};
const getSecurityDeposit = (req, res) => {
  const tenantId = req.params.id; // this is tenants.id

  const query = `
    SELECT rc.deposit, pu.deposit as unit_deposit
    FROM rental_contracts rc
    JOIN property_units pu ON rc.unit_id = pu.id
    WHERE rc.tenant_id = ? AND rc.status = 'active'
    LIMIT 1
  `;

  db.execute(query, [tenantId])
    .then(([results]) => {
      if (results.length === 0) {
        console.log('[getSecurityDeposit] No deposit found for tenant:', tenantId);
        return res.json({ securityDeposit: null });
      }

      const deposit = results[0].deposit || results[0].unit_deposit;
      console.log('[getSecurityDeposit] Found deposit:', deposit);
      return res.json({ securityDeposit: deposit });
    })
    .catch((err) => {
      console.error('[getSecurityDeposit] DB error:', err);
      return res.status(500).json({ message: 'Database error' });
    });
};

const updateTenant = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      fullName,
      sex,
      phone,
      city,
      subcity,
      woreda,
      houseNo,
      organization,
      hasAgent,
      agentFullName,
      agentSex,
      agentPhone,
      agentCity,
      agentSubcity,
      agentWoreda,
      agentHouseNo,
      authenticationNo,
      authenticationDate
    } = req.body;

    await db.execute(
      `UPDATE tenants SET
        full_name = ?, sex = ?, phone = ?, city = ?, subcity = ?, woreda = ?, house_no = ?, organization = ?,
        has_agent = ?, agent_full_name = ?, agent_sex = ?, agent_phone = ?, agent_city = ?, agent_subcity = ?,
        agent_woreda = ?, agent_house_no = ?, authentication_no = ?, authentication_date = ?
       WHERE id = ? AND organization_id = ?`,
      [
        fullName, sex, phone, city, subcity, woreda, houseNo, organization,
        hasAgent, agentFullName, agentSex, agentPhone, agentCity, agentSubcity,
        agentWoreda, agentHouseNo, authenticationNo, authenticationDate && authenticationDate.trim() !== '' ? authenticationDate : null,
        id, req.user.organization_id
      ]
    );

    res.json({ message: 'Tenant updated successfully' });
  } catch (error) {
    console.error('Update tenant error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteTenant = async (req, res) => {
  try {
    const { id } = req.params;

    await db.execute(
      'UPDATE tenants SET is_active = FALSE WHERE id = ? AND organization_id = ?',
      [id, req.user.organization_id]
    );

    res.json({ message: 'Tenant deleted successfully' });
  } catch (error) {
    console.error('Delete tenant error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
const terminateTenant = async (req, res) => {
  const connection = await db.getConnection(); // Get dedicated connection for transaction
  try {
    const { id } = req.params;
    const {
      terminationDate,
      terminationReason,
      securityDepositAction, // 'return_full', 'return_partial', 'keep_full'
      partialReturnAmount,
      deductions,
      notes
    } = req.body;

    // Start transaction using query()
    await connection.query('START TRANSACTION');

    // Verify tenant belongs to organization
    const [tenants] = await connection.execute(
      'SELECT * FROM tenants WHERE id = ? AND organization_id = ?',
      [id, req.user.organization_id]
    );

    if (tenants.length === 0) {
      await connection.query('ROLLBACK');
      return res.status(404).json({ message: 'Tenant not found' });
    }

    const tenant = tenants[0];

    // Get active contract
    const [contracts] = await connection.execute(
      `SELECT rc.*, p.name as property_name, pu.unit_number 
       FROM rental_contracts rc
       JOIN properties p ON rc.property_id = p.id
       JOIN property_units pu ON rc.unit_id = pu.id
       WHERE rc.tenant_id = ? AND rc.status = 'active' AND rc.organization_id = ?`,
      [id, req.user.organization_id]
    );

    if (contracts.length === 0) {
      await connection.query('ROLLBACK');
      return res.status(404).json({ message: 'No active contract found for this tenant' });
    }

    const contract = contracts[0];

    // 1. Terminate the contract
    await connection.execute(
      `UPDATE rental_contracts 
       SET status = 'terminated', 
           actual_end_date = ?,
           termination_reason = ?,
           termination_date = ?
       WHERE id = ? AND organization_id = ?`,
      [terminationDate, terminationReason, terminationDate, contract.id, req.user.organization_id]
    );

    // 2. Handle security deposit
    let depositReturnAmount = 0;
    if (securityDepositAction === 'return_full') {
      depositReturnAmount = contract.security_deposit;
    } else if (securityDepositAction === 'return_partial') {
      depositReturnAmount = partialReturnAmount || 0;
    }

    // Record security deposit transaction if returning any amount
    if (depositReturnAmount > 0) {
      await connection.execute(
        `INSERT INTO payments (organization_id, contract_id, tenant_id, amount, payment_date, due_date, payment_type, payment_method, status, notes) 
         VALUES (?, ?, ?, ?, ?, ?, 'deposit_return', 'cash', 'paid', ?)`,
        [
          req.user.organization_id,
          contract.id,
          id,
          -depositReturnAmount, // Negative amount for refund
          terminationDate,
          terminationDate,
          `Security deposit return: ${securityDepositAction}`
        ]
      );
    }

    // 3. Record deductions if any
    if (deductions && deductions.length > 0) {
      for (const deduction of deductions) {
        await connection.execute(
          `INSERT INTO payments (organization_id, contract_id, tenant_id, amount, payment_date, due_date, payment_type, payment_method, status, notes) 
           VALUES (?, ?, ?, ?, ?, ?, 'deduction', 'deduction', 'paid', ?)`,
          [
            req.user.organization_id,
            contract.id,
            id,
            deduction.amount,
            terminationDate,
            terminationDate,
            `Deduction: ${deduction.description}`
          ]
        );
      }
    }

    // 4. Cancel any future pending payments
    await connection.execute(
      `UPDATE payments 
       SET status = 'cancelled', notes = CONCAT(IFNULL(notes, ''), ' - Cancelled due to tenant termination')
       WHERE contract_id = ? AND status = 'pending' AND due_date > ?`,
      [contract.id, terminationDate]
    );

    // 5. Update tenant status
    await connection.execute(
  `UPDATE tenants 
   SET termination_date = ?,
       termination_reason = ?,
       termination_notes = ?
   WHERE id = ? AND organization_id = ?`,
  [terminationDate, terminationReason, notes, id, req.user.organization_id]
);
    // 6. Create notification for landlord
    await connection.execute(
      `INSERT INTO notifications (organization_id, user_id, title, message, type) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        req.user.organization_id,
        contract.landlord_id,
        'Tenant Terminated',
        `Tenant ${tenant.full_name} at ${contract.property_name} Unit ${contract.unit_number} has been terminated. Reason: ${terminationReason}`,
        'general'
      ]
    );

    await connection.execute(
  `UPDATE property_units 
   SET is_occupied = 0
   WHERE id = ?`,
  [contract.unit_id]
);
    await connection.query('COMMIT');

    res.json({
      message: 'Tenant terminated successfully',
      terminationDetails: {
        tenant_name: tenant.full_name,
        property: `${contract.property_name} Unit ${contract.unit_number}`,
        termination_date: terminationDate,
        deposit_returned: depositReturnAmount,
        reason: terminationReason
      }
    });

  } catch (error) {
    await connection.query('ROLLBACK');
    console.error('Terminate tenant error:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    connection.release(); // Always release the connection back to the pool
  }
};



const getTerminatedTenants = async (req, res) => {
  try {
    const [tenants] = await db.execute(
      `SELECT t.*, 
              rc.id as contract_id,
              p.name as property_name,
              pu.unit_number,
              rc.monthly_rent,
              rc.contract_start_date,
              rc.contract_end_date,
              rc.status as contract_status
       FROM tenants t
       LEFT JOIN rental_contracts rc ON t.id = rc.tenant_id AND rc.status = 'terminated'
       LEFT JOIN properties p ON rc.property_id = p.id
       LEFT JOIN property_units pu ON rc.unit_id = pu.id
       WHERE t.organization_id = ? AND t.is_active = TRUE AND t.termination_date IS NOT NULL
       ORDER BY t.termination_date DESC`,
      [req.user.organization_id]
    );

    res.json({ tenants });
  } catch (error) {
    console.error('Get terminated tenants error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createTenant,
  getTenants,
  getTenantById,
  updateTenant,
  deleteTenant,
  terminateTenant,
  getTerminatedTenants,
  getSecurityDeposit
  getSecurityDeposit
};