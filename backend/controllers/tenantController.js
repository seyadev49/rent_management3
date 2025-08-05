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
              rc.status as contract_status
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

module.exports = {
  createTenant,
  getTenants,
  getTenantById,
  updateTenant,
  deleteTenant
};