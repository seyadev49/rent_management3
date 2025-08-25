const db = require('../db/connection');

const createMaintenanceRequest = async (req, res) => {
  try {
    const {
      propertyId,
      unitId,
      tenantId,
      title,
      description,
      priority = 'medium',
      estimatedCost,
      requestedDate
    } = req.body;

    const [result] = await db.execute(
      `INSERT INTO maintenance_requests (organization_id, property_id, unit_id, tenant_id, title, description, priority, estimated_cost, requested_date) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.organization_id, propertyId, unitId || null, tenantId || null, title, description, priority, estimatedCost || null, requestedDate]
    );

    res.status(201).json({
      message: 'Maintenance request created successfully',
      requestId: result.insertId
    });
  } catch (error) {
    console.error('Create maintenance request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getMaintenanceRequests = async (req, res) => {
  try {
    const { status, priority, propertyId } = req.query;
    
    let query = `
      SELECT mr.*, p.name as property_name, pu.unit_number, t.full_name as tenant_name,
             u.full_name as assigned_to_name
      FROM maintenance_requests mr
      JOIN properties p ON mr.property_id = p.id
      LEFT JOIN property_units pu ON mr.unit_id = pu.id
      LEFT JOIN tenants t ON mr.tenant_id = t.id
      LEFT JOIN users u ON mr.assigned_to = u.id
      WHERE mr.organization_id = ?
    `;
    
    const params = [req.user.organization_id];
    
    if (status) {
      query += ' AND mr.status = ?';
      params.push(status);
    }
    
    if (priority) {
      query += ' AND mr.priority = ?';
      params.push(priority);
    }
    
    if (propertyId) {
      query += ' AND mr.property_id = ?';
      params.push(propertyId);
    }
    
    query += ' ORDER BY mr.requested_date DESC';
    
    const [requests] = await db.execute(query, params);
    
    res.json({ requests });
  } catch (error) {
    console.error('Get maintenance requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getMaintenanceRequestById = async (req, res) => {
  try {
    const { id } = req.params;

    const [requests] = await db.execute(
      `SELECT mr.*, p.name as property_name, pu.unit_number, t.full_name as tenant_name,
              u.full_name as assigned_to_name
       FROM maintenance_requests mr
       JOIN properties p ON mr.property_id = p.id
       LEFT JOIN property_units pu ON mr.unit_id = pu.id
       LEFT JOIN tenants t ON mr.tenant_id = t.id
       LEFT JOIN users u ON mr.assigned_to = u.id
       WHERE mr.id = ? AND mr.organization_id = ?`,
      [id, req.user.organization_id]
    );

    if (requests.length === 0) {
      return res.status(404).json({ message: 'Maintenance request not found' });
    }

    res.json({ request: requests[0] });
  } catch (error) {
    console.error('Get maintenance request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateMaintenanceRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      assignedTo,
      actualCost,
      completionNotes,
      completedDate
    } = req.body;

    let updateQuery = 'UPDATE maintenance_requests SET ';
    const updateParams = [];
    const updateFields = [];

    if (status) {
      updateFields.push('status = ?');
      updateParams.push(status);
    }

    if (assignedTo) {
      updateFields.push('assigned_to = ?');
      updateParams.push(assignedTo);
    }

    if (actualCost !== undefined) {
      updateFields.push('actual_cost = ?');
      updateParams.push(actualCost);
    }

    if (completionNotes) {
      updateFields.push('completion_notes = ?');
      updateParams.push(completionNotes);
    }

    if (completedDate) {
      updateFields.push('completed_date = ?');
      updateParams.push(completedDate);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    updateQuery += updateFields.join(', ');
    updateQuery += ' WHERE id = ? AND organization_id = ?';
    updateParams.push(id, req.user.organization_id);

    await db.execute(updateQuery, updateParams);

    res.json({ message: 'Maintenance request updated successfully' });
  } catch (error) {
    console.error('Update maintenance request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteMaintenanceRequest = async (req, res) => {
  try {
    const { id } = req.params;

    await db.execute(
      'DELETE FROM maintenance_requests WHERE id = ? AND organization_id = ?',
      [id, req.user.organization_id]
    );

    res.json({ message: 'Maintenance request deleted successfully' });
  } catch (error) {
    console.error('Delete maintenance request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createMaintenanceRequest,
  getMaintenanceRequests,
  getMaintenanceRequestById,
  updateMaintenanceRequest,
  deleteMaintenanceRequest
};