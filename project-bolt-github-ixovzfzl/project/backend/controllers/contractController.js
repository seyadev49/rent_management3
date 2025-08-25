const db = require('../db/connection');

const createContract = async (req, res) => {
  const connection = await db.getConnection(); // Get dedicated connection for transaction
  try {
    const {
      propertyId,
      unitId,
      tenantId,
      leaseDuration,
      contractStartDate,
      contractEndDate,
      monthlyRent,
      deposit,
      paymentTerm,
      rentStartDate,
      rentEndDate,
      eeuPayment = 0,
      waterPayment = 0,
      generatorPayment = 0
    } = req.body;

    // Defensive parsing -> ensure numbers are numbers
    const monthlyRentNum = parseFloat(monthlyRent) || 0;
    const leaseDurationNum = parseInt(leaseDuration, 10) || 0;
    const eeuNum = parseFloat(eeuPayment) || 0;
    const waterNum = parseFloat(waterPayment) || 0;
    const genNum = parseFloat(generatorPayment) || 0;

    const totalAmount = (monthlyRentNum * leaseDurationNum) + eeuNum + waterNum + genNum;

    await connection.query('START TRANSACTION');

    // 1. Check for existing active contract
    const [existingContracts] = await connection.execute(
      "SELECT id FROM rental_contracts WHERE unit_id = ? AND status = 'active' AND organization_id = ?",
      [unitId, req.user.organization_id]
    );

    if (existingContracts.length > 0) {
      await connection.query('ROLLBACK');
      return res.status(400).json({ message: 'Unit is already occupied with an active contract' });
    }

    // 2. Double-check unit occupancy status
    const [unitRows] = await connection.execute(
      'SELECT is_occupied FROM property_units WHERE id = ?',
      [unitId]
    );

    if (unitRows.length === 0) {
      await connection.query('ROLLBACK');
      return res.status(404).json({ message: 'Property unit not found' });
    }

    if (unitRows[0].is_occupied) {
      await connection.query('ROLLBACK');
      return res.status(400).json({ message: 'Unit is marked as occupied' });
    }

    // 3. Insert new rental contract
    const insertQuery = `
      INSERT INTO rental_contracts (
        organization_id, property_id, unit_id, tenant_id, landlord_id,
        lease_duration, contract_start_date, contract_end_date, monthly_rent, deposit,
        payment_term, rent_start_date, rent_end_date, total_amount,
        eeu_payment, water_payment, generator_payment
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const insertParams = [
      req.user.organization_id,
      propertyId,
      unitId,
      tenantId,
      req.user.id,
      leaseDurationNum,
      contractStartDate,
      contractEndDate,
      monthlyRentNum,
      deposit,
      paymentTerm,
      rentStartDate,
      rentEndDate,
      totalAmount,
      eeuNum,
      waterNum,
      genNum
    ];

    const [result] = await connection.execute(insertQuery, insertParams);

    // 4. Mark the unit as occupied
    await connection.execute(
      'UPDATE property_units SET is_occupied = TRUE WHERE id = ?',
      [unitId]
    );

    // Commit all changes together
    await connection.query('COMMIT');

    res.status(201).json({
      message: 'Contract created successfully',
      contractId: result.insertId
    });

  } catch (error) {
    await connection.query('ROLLBACK');
    console.error('Create contract error:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    connection.release();
  }
};

const getContracts = async (req, res) => {
  try {
    const { status, propertyId, tenantId } = req.query;
    
    let query = `
      SELECT rc.*, t.full_name as tenant_name, t.phone as tenant_phone,
             p.name as property_name, pu.unit_number,
             u.full_name as landlord_name
      FROM rental_contracts rc
      JOIN tenants t ON rc.tenant_id = t.id
      JOIN properties p ON rc.property_id = p.id
      JOIN property_units pu ON rc.unit_id = pu.id
      JOIN users u ON rc.landlord_id = u.id
      WHERE rc.organization_id = ?
    `;
    
    const params = [req.user.organization_id];
    
    if (status) {
      query += ' AND rc.status = ?';
      params.push(status);
    }
    
    if (propertyId) {
      query += ' AND rc.property_id = ?';
      params.push(propertyId);
    }
    
    if (tenantId) {
      query += ' AND rc.tenant_id = ?';
      params.push(tenantId);
    }
    
    query += ' ORDER BY rc.created_at DESC';
    
    const [contracts] = await db.execute(query, params);
    
    res.json({ contracts });
  } catch (error) {
    console.error('Get contracts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getContractById = async (req, res) => {
  try {
    const { id } = req.params;

    const [contracts] = await db.execute(
      `SELECT rc.*, t.full_name as tenant_name, t.phone as tenant_phone, t.email as tenant_email,
              p.name as property_name, p.address as property_address,
              pu.unit_number, pu.room_count,
              u.full_name as landlord_name
       FROM rental_contracts rc
       JOIN tenants t ON rc.tenant_id = t.id
       JOIN properties p ON rc.property_id = p.id
       JOIN property_units pu ON rc.unit_id = pu.id
       JOIN users u ON rc.landlord_id = u.id
       WHERE rc.id = ? AND rc.organization_id = ?`,
      [id, req.user.organization_id]
    );

    if (contracts.length === 0) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    res.json({ contract: contracts[0] });
  } catch (error) {
    console.error('Get contract error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateContract = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, contractEndDate, monthlyRent } = req.body;

    const updateFields = [];
    const updateParams = [];

    if (status) {
      updateFields.push('status = ?');
      updateParams.push(status);
      
      // If terminating contract, free up the unit
      if (status === 'terminated' || status === 'expired') {
        const [contract] = await db.execute(
          'SELECT unit_id FROM rental_contracts WHERE id = ? AND organization_id = ?',
          [id, req.user.organization_id]
        );
        
        if (contract.length > 0) {
          await db.execute(
            'UPDATE property_units SET is_occupied = FALSE WHERE id = ?',
            [contract[0].unit_id]
          );
        }
      }
    }

    if (contractEndDate) {
      updateFields.push('contract_end_date = ?');
      updateParams.push(contractEndDate);
    }

    if (monthlyRent) {
      updateFields.push('monthly_rent = ?');
      updateParams.push(monthlyRent);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    const updateQuery = `UPDATE rental_contracts SET ${updateFields.join(', ')} WHERE id = ? AND organization_id = ?`;
    updateParams.push(id, req.user.organization_id);

    await db.execute(updateQuery, updateParams);

    res.json({ message: 'Contract updated successfully' });
  } catch (error) {
    console.error('Update contract error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteContract = async (req, res) => {
  try {
    const { id } = req.params;

    // Get unit ID before deleting
    const [contract] = await db.execute(
      'SELECT unit_id FROM rental_contracts WHERE id = ? AND organization_id = ?',
      [id, req.user.organization_id]
    );

    if (contract.length > 0) {
      // Free up the unit
      await db.execute(
        'UPDATE property_units SET is_occupied = FALSE WHERE id = ?',
        [contract[0].unit_id]
      );
    }

    await db.execute(
      'DELETE FROM rental_contracts WHERE id = ? AND organization_id = ?',
      [id, req.user.organization_id]
    );

    res.json({ message: 'Contract deleted successfully' });
  } catch (error) {
    console.error('Delete contract error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const renewContract = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { id } = req.params;
    const { newEndDate, monthlyRent, deposit, notes } = req.body;

    await connection.query('START TRANSACTION');

    // Get current contract details
    const [contracts] = await connection.execute(
      `SELECT rc.*, t.full_name as tenant_name, p.name as property_name, pu.unit_number
       FROM rental_contracts rc
       JOIN tenants t ON rc.tenant_id = t.id
       JOIN properties p ON rc.property_id = p.id
       JOIN property_units pu ON rc.unit_id = pu.id
       WHERE rc.id = ? AND rc.organization_id = ?`,
      [id, req.user.organization_id]
    );

    if (contracts.length === 0) {
      await connection.query('ROLLBACK');
      return res.status(404).json({ message: 'Contract not found' });
    }

    const contract = contracts[0];

    // Update the existing contract
    await connection.execute(
      `UPDATE rental_contracts 
       SET contract_end_date = ?, 
           monthly_rent = ?, 
           deposit = COALESCE(?, deposit),
           status = 'active',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND organization_id = ?`,
      [newEndDate, monthlyRent, deposit, id, req.user.organization_id]
    );

    // Create a renewal record in contract history (if you have such a table)
    // For now, we'll add a note to the activity logs
    await connection.execute(
      `INSERT INTO activity_logs (user_id, organization_id, action, details) 
       VALUES (?, ?, 'contract_renewed', ?)`,
      [
        req.user.id,
        req.user.organization_id,
        JSON.stringify({
          contract_id: id,
          tenant_name: contract.tenant_name,
          property: `${contract.property_name} Unit ${contract.unit_number}`,
          old_end_date: contract.contract_end_date,
          new_end_date: newEndDate,
          new_monthly_rent: monthlyRent,
          notes: notes
        })
      ]
    );

    // Create notification for landlord
    await connection.execute(
      `INSERT INTO notifications (organization_id, user_id, title, message, type) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        req.user.organization_id,
        contract.landlord_id,
        'Contract Renewed',
        `Contract for ${contract.tenant_name} at ${contract.property_name} Unit ${contract.unit_number} has been renewed until ${new Date(newEndDate).toLocaleDateString()}. ${notes ? 'Notes: ' + notes : ''}`,
        'general'
      ]
    );

    await connection.query('COMMIT');

    res.json({
      message: 'Contract renewed successfully',
      renewalDetails: {
        tenant_name: contract.tenant_name,
        property: `${contract.property_name} Unit ${contract.unit_number}`,
        new_end_date: newEndDate,
        monthly_rent: monthlyRent
      }
    });

  } catch (error) {
    await connection.query('ROLLBACK');
    console.error('Renew contract error:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    connection.release();
  }
};

module.exports = {
  createContract,
  getContracts,
  getContractById,
  updateContract,
  deleteContract,
  renewContract
};