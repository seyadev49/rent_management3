
const db = require('../db/connection');
const bcrypt = require('bcryptjs');

async function createSuperAdmin() {
  try {
    const email = process.env.SUPER_ADMIN_EMAIL || 'admin@yoursaas.com';
    const password = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin123!';
    const name = 'Super Administrator';

    // Check if super admin already exists
    const [existingAdmin] = await db.execute(
      'SELECT id FROM users WHERE email = ? AND role = ?',
      [email, 'super_admin']
    );

    if (existingAdmin.length > 0) {
      console.log('Super admin already exists!');
      return;
    }

    // Create super admin organization
    const [orgResult] = await db.execute(
      `INSERT INTO organizations (name, email, subscription_plan, subscription_status) 
       VALUES (?, ?, ?, ?)`,
      ['SaaS Administration', email, 'enterprise', 'active']
    );

    const organizationId = orgResult.insertId;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create super admin user
    await db.execute(
      `INSERT INTO users (organization_id, name, email, password, role, is_active) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [organizationId, name, email, hashedPassword, 'super_admin', true]
    );

    console.log('Super admin created successfully!');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('Please change the password after first login.');

  } catch (error) {
    console.error('Error creating super admin:', error);
  } finally {
    process.exit();
  }
}

// Run if called directly
if (require.main === module) {
  createSuperAdmin();
}

module.exports = createSuperAdmin;
