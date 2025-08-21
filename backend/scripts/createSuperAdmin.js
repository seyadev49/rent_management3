const db = require('../db/connection');
const bcrypt = require('bcryptjs');

async function createSuperAdmin() {
  try {
    const email = process.env.SUPER_ADMIN_EMAIL || 'admin@yoursaas.com';
    const password = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin123!';
    const fullName = 'Super Administrator';

    // --- Check if organization exists ---
    const [existingOrg] = await db.execute(
      'SELECT id FROM organizations WHERE email = ?',
      [email]
    );

    let organizationId;

    if (existingOrg.length > 0) {
      organizationId = existingOrg[0].id;
      console.log('Organization already exists, using existing one.');
    } else {
      // Set trial dates (example: 30-day trial)
      const trialStartDate = new Date();
      const trialEndDate = new Date();
      trialEndDate.setDate(trialStartDate.getDate() + 30);

      // Create super admin organization
      const [orgResult] = await db.execute(
        `INSERT INTO organizations 
         (name, email, subscription_plan, subscription_status, trial_start_date, trial_end_date) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        ['SaaS Administration', email, 'enterprise', 'active', trialStartDate, trialEndDate]
      );

      organizationId = orgResult.insertId;
      console.log('Super admin organization created successfully.');
    }

    // --- Check if super admin user exists ---
    const [existingAdmin] = await db.execute(
      'SELECT id FROM users WHERE email = ? AND role = ?',
      [email, 'super_admin'] // adjust role if 'super_admin' is not in enum
    );

    if (existingAdmin.length > 0) {
      console.log('Super admin already exists!');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // --- Create super admin user ---
    await db.execute(
      `INSERT INTO users (organization_id, full_name, email, password, role, is_active) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [organizationId, fullName, email, hashedPassword, 'admin', 1]
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
