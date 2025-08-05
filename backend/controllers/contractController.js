const db = require('../db/connection');

const createContract = async (req, res) => {
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

    // Calculate total amount
    const totalAmount = (monthlyRent * leaseDuration) + parseFloat(eeuPayment) + parseFloat(waterPayment) + parseFloat(generatorPayment);

    // Check if unit is already occupied
    const [existingContracts] = await db.execute(
      'SELECT id FROM rental_contracts WHERE unit_id = ? AND status = "active"',
      [unitId]
    );

    if (existingContracts.length > 0) {
      return res.status(400).json({ message: 'Unit is already occupied' });
    }

    const [result] = await db.execute(
      `INSERT INTO rental_contracts (
        organization_id, property_id, unit_id, tenant_id, landlord_id,
        lease_duration, contract_start_date, contract_end_date, monthly_rent, deposit,
        payment_term, rent_start_date, rent_end_date, total_amount,
        eeu_payment, water_payment, generator_payment
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.organization_id, propertyId, unitId, tenantId, req.user.id,
        leaseDuration, contractStartDate, contractEndDate, monthlyRent, deposit,
        paymentTerm, rentStartDate, rentEndDate, totalAmount,
        eeuPayment, waterPayment, generatorPayment
      ]
    );

    // Update unit as occupied
    await db.execute(
      'UPDATE property_units SET is_occupied = TRUE WHERE id = ?',
      [unitId]
    );

    res.status(201).json({
      message: 'Contract created successfully',
      contractId: result.insertId
    });
  } catch (error) {
    console.error('Create contract error:', error);
    res.status(500).json({ message: 'Server error' });
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

module.exports = {
  createContract,
  getContracts,
  getContractById,
  updateContract,
  deleteContract
};