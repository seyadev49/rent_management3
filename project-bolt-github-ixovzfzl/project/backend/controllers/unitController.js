const db = require('../db/connection');

const createUnit = async (req, res) => {
  try {
    const {
      propertyId,
      unitNumber,
      floorNumber,
      roomCount,
      monthlyRent,
      deposit
    } = req.body;

    // Verify property belongs to organization
    const [properties] = await db.execute(
      'SELECT id FROM properties WHERE id = ? AND organization_id = ?',
      [propertyId, req.user.organization_id]
    );

    if (properties.length === 0) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Check if unit number already exists for this property
    const [existingUnits] = await db.execute(
      'SELECT id FROM property_units WHERE property_id = ? AND unit_number = ? AND is_active = TRUE',
      [propertyId, unitNumber]
    );

    if (existingUnits.length > 0) {
      return res.status(400).json({ message: 'Unit number already exists for this property' });
    }

    const [result] = await db.execute(
      `INSERT INTO property_units (property_id, unit_number, floor_number, room_count, monthly_rent, deposit) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [propertyId, unitNumber, floorNumber || null, roomCount || null, monthlyRent, deposit]
    );

    // Update property total units count
    await db.execute(
      `UPDATE properties SET total_units = (
        SELECT COUNT(*) FROM property_units WHERE property_id = ? AND is_active = TRUE
      ) WHERE id = ?`,
      [propertyId, propertyId]
    );

    res.status(201).json({
      message: 'Unit created successfully',
      unitId: result.insertId
    });
  } catch (error) {
    console.error('Create unit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getUnits = async (req, res) => {
  try {
    const { propertyId } = req.query;
    
    let query = `
      SELECT pu.*, p.name as property_name,
             CASE WHEN rc.id IS NOT NULL THEN TRUE ELSE FALSE END as is_occupied,
             rc.id as contract_id, t.full_name as tenant_name
      FROM property_units pu
      JOIN properties p ON pu.property_id = p.id
      LEFT JOIN rental_contracts rc ON pu.id = rc.unit_id AND rc.status = 'active'
      LEFT JOIN tenants t ON rc.tenant_id = t.id
      WHERE p.organization_id = ? AND pu.is_active = TRUE
    `;
    
    const params = [req.user.organization_id];
    
    if (propertyId) {
      query += ' AND pu.property_id = ?';
      params.push(propertyId);
    }
    
    query += ' ORDER BY p.name, pu.unit_number';
    
    const [units] = await db.execute(query, params);
    
    res.json({ units });
  } catch (error) {
    console.error('Get units error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getUnitById = async (req, res) => {
  try {
    const { id } = req.params;

    const [units] = await db.execute(
      `SELECT pu.*, p.name as property_name, p.organization_id,
              CASE WHEN rc.id IS NOT NULL THEN TRUE ELSE FALSE END as is_occupied,
              rc.id as contract_id, t.full_name as tenant_name
       FROM property_units pu
       JOIN properties p ON pu.property_id = p.id
       LEFT JOIN rental_contracts rc ON pu.id = rc.unit_id AND rc.status = 'active'
       LEFT JOIN tenants t ON rc.tenant_id = t.id
       WHERE pu.id = ? AND p.organization_id = ?`,
      [id, req.user.organization_id]
    );

    if (units.length === 0) {
      return res.status(404).json({ message: 'Unit not found' });
    }

    res.json({ unit: units[0] });
  } catch (error) {
    console.error('Get unit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateUnit = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      unitNumber,
      floorNumber,
      roomCount,
      monthlyRent,
      deposit
    } = req.body;

    // Verify unit belongs to organization
    const [units] = await db.execute(
      `SELECT pu.property_id FROM property_units pu
       JOIN properties p ON pu.property_id = p.id
       WHERE pu.id = ? AND p.organization_id = ?`,
      [id, req.user.organization_id]
    );

    if (units.length === 0) {
      return res.status(404).json({ message: 'Unit not found' });
    }

    // Check if new unit number conflicts with existing units (excluding current unit)
    if (unitNumber) {
      const [existingUnits] = await db.execute(
        'SELECT id FROM property_units WHERE property_id = ? AND unit_number = ? AND id != ? AND is_active = TRUE',
        [units[0].property_id, unitNumber, id]
      );

      if (existingUnits.length > 0) {
        return res.status(400).json({ message: 'Unit number already exists for this property' });
      }
    }

    const updateFields = [];
    const updateParams = [];

    if (unitNumber) {
      updateFields.push('unit_number = ?');
      updateParams.push(unitNumber);
    }

    if (floorNumber !== undefined) {
      updateFields.push('floor_number = ?');
      updateParams.push(floorNumber);
    }

    if (roomCount !== undefined) {
      updateFields.push('room_count = ?');
      updateParams.push(roomCount);
    }

    if (monthlyRent !== undefined) {
      updateFields.push('monthly_rent = ?');
      updateParams.push(monthlyRent);
    }

    if (deposit !== undefined) {
      updateFields.push('deposit = ?');
      updateParams.push(deposit);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    const updateQuery = `UPDATE property_units SET ${updateFields.join(', ')} WHERE id = ?`;
    updateParams.push(id);

    await db.execute(updateQuery, updateParams);

    res.json({ message: 'Unit updated successfully' });
  } catch (error) {
    console.error('Update unit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteUnit = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify unit belongs to organization and check if occupied
    const [units] = await db.execute(
      `SELECT pu.property_id, 
              CASE WHEN rc.id IS NOT NULL THEN TRUE ELSE FALSE END as is_occupied
       FROM property_units pu
       JOIN properties p ON pu.property_id = p.id
       LEFT JOIN rental_contracts rc ON pu.id = rc.unit_id AND rc.status = 'active'
       WHERE pu.id = ? AND p.organization_id = ?`,
      [id, req.user.organization_id]
    );

    if (units.length === 0) {
      return res.status(404).json({ message: 'Unit not found' });
    }

    if (units[0].is_occupied) {
      return res.status(400).json({ message: 'Cannot delete occupied unit' });
    }

    const propertyId = units[0].property_id;

    // Soft delete the unit
    await db.execute(
      'UPDATE property_units SET is_active = FALSE WHERE id = ?',
      [id]
    );

    // Update property total units count
    await db.execute(
      `UPDATE properties SET total_units = (
        SELECT COUNT(*) FROM property_units WHERE property_id = ? AND is_active = TRUE
      ) WHERE id = ?`,
      [propertyId, propertyId]
    );

    res.json({ message: 'Unit deleted successfully' });
  } catch (error) {
    console.error('Delete unit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createUnit,
  getUnits,
  getUnitById,
  updateUnit,
  deleteUnit
};