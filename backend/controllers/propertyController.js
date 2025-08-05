const db = require('../db/connection');

const createProperty = async (req, res) => {
  try {
    const {
      name,
      type,
      address,
      city,
      subcity,
      woreda,
      description,
      totalUnits,
      amenities,
      units
    } = req.body;

    // Create property
    const [propertyResult] = await db.execute(
      `INSERT INTO properties (organization_id, landlord_id, name, type, address, city, subcity, woreda, description, total_units, amenities) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.organization_id,
        req.user.id,
        name,
        type,
        address,
        city,
        subcity,
        woreda,
        description,
        totalUnits,
        JSON.stringify(amenities || [])
      ]
    );

    const propertyId = propertyResult.insertId;

    // Create property units
    if (units && units.length > 0) {
      for (const unit of units) {
        await db.execute(
          `INSERT INTO property_units (property_id, unit_number, floor_number, room_count, monthly_rent, deposit) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [propertyId, unit.unitNumber, unit.floorNumber, unit.roomCount, unit.monthlyRent, unit.deposit]
        );
      }
    }

    res.status(201).json({
      message: 'Property created successfully',
      propertyId
    });
  } catch (error) {
    console.error('Create property error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getProperties = async (req, res) => {
  try {
    const [properties] = await db.execute(
      `SELECT p.*, 
              COUNT(pu.id) as total_units,
              COUNT(CASE WHEN pu.is_occupied = TRUE THEN 1 END) as occupied_units,
              COUNT(CASE WHEN pu.is_occupied = FALSE THEN 1 END) as vacant_units
       FROM properties p
       LEFT JOIN property_units pu ON p.id = pu.property_id AND pu.is_active = TRUE
       WHERE p.organization_id = ? AND p.is_active = TRUE
       GROUP BY p.id
       ORDER BY p.created_at DESC`,
      [req.user.organization_id]
    );

    res.json({ properties });
  } catch (error) {
    console.error('Get properties error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getPropertyById = async (req, res) => {
  try {
    const { id } = req.params;

    const [properties] = await db.execute(
      'SELECT * FROM properties WHERE id = ? AND organization_id = ?',
      [id, req.user.organization_id]
    );

    if (properties.length === 0) {
      return res.status(404).json({ message: 'Property not found' });
    }

    const [units] = await db.execute(
      'SELECT * FROM property_units WHERE property_id = ? AND is_active = TRUE ORDER BY unit_number',
      [id]
    );

    const property = properties[0];
    property.units = units;

    res.json({ property });
  } catch (error) {
    console.error('Get property error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      type,
      address,
      city,
      subcity,
      woreda,
      description,
      amenities
    } = req.body;

    await db.execute(
      `UPDATE properties 
       SET name = ?, type = ?, address = ?, city = ?, subcity = ?, woreda = ?, description = ?, amenities = ?
       WHERE id = ? AND organization_id = ?`,
      [name, type, address, city, subcity, woreda, description, JSON.stringify(amenities || []), id, req.user.organization_id]
    );

    res.json({ message: 'Property updated successfully' });
  } catch (error) {
    console.error('Update property error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteProperty = async (req, res) => {
  try {
    const { id } = req.params;

    await db.execute(
      'UPDATE properties SET is_active = FALSE WHERE id = ? AND organization_id = ?',
      [id, req.user.organization_id]
    );

    res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Delete property error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createProperty,
  getProperties,
  getPropertyById,
  updateProperty,
  deleteProperty
};