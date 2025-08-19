const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const db = require('../db/connection');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../services/emailService');

const generateToken = (userId, organizationId) => {
  return jwt.sign(
    { userId, organizationId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

const register = async (req, res) => {
  try {
    const {
      organizationName,
      email,
      password,
      fullName,
      phone,
      address
    } = req.body;

    // Check if user already exists
    const [existingUsers] = await db.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create organization with 7-day trial
    const trialStartDate = new Date();
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 7);

    const [orgResult] = await db.execute(
      `INSERT INTO organizations (name, email, phone, address, trial_start_date, trial_end_date, subscription_status) 
       VALUES (?, ?, ?, ?, ?, ?, 'trial')`,
      [organizationName, email, phone, address, trialStartDate, trialEndDate]
    );

    const organizationId = orgResult.insertId;

    // Create user
    const [userResult] = await db.execute(
      'INSERT INTO users (organization_id, email, password, full_name, phone, role) VALUES (?, ?, ?, ?, ?, ?)',
      [organizationId, email, hashedPassword, fullName, phone, 'landlord']
    );

    const userId = userResult.insertId;
    const token = generateToken(userId, organizationId);

    // Send welcome email
    try {
      await sendWelcomeEmail(email, fullName, organizationName);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail registration if email fails
    }

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: userId,
        email,
        fullName,
        role: 'landlord',
        organizationId,
        trialEndDate
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Get user with organization details
    const [users] = await db.execute(
      `SELECT u.*, o.name as organization_name, o.subscription_status, o.trial_end_date 
       FROM users u 
       JOIN organizations o ON u.organization_id = o.id 
       WHERE u.email = ? AND u.is_active = TRUE`,
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = users[0];

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if trial has expired
    if (user.subscription_status === 'trial' && new Date() > new Date(user.trial_end_date)) {
      return res.status(403).json({ message: 'Trial period has expired. Please upgrade your subscription.' });
    }

    const token = generateToken(user.id, user.organization_id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        organizationId: user.organization_id,
        organizationName: user.organization_name,
        subscriptionStatus: user.subscription_status,
        trialEndDate: user.trial_end_date
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getProfile = async (req, res) => {
  try {
    const [users] = await db.execute(
      `SELECT u.id, u.email, u.full_name, u.phone, u.role, u.organization_id,
              o.name as organization_name, o.subscription_status, o.trial_end_date
       FROM users u 
       JOIN organizations o ON u.organization_id = o.id 
       WHERE u.id = ?`,
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users[0];
    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if user exists
    const [users] = await db.execute(
      'SELECT id, full_name, email FROM users WHERE email = ? AND is_active = TRUE',
      [email]
    );

    // Always return the same message for security
    const message = 'If this email exists in our system, a password reset link has been sent.';

    if (users.length === 0) {
      return res.json({ message });
    }

    const user = users[0];

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1); // 1 hour expiry

    // Store reset token in database
    await db.execute(
      'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?',
      [resetToken, resetTokenExpiry, user.id]
    );

    // Send reset email
    try {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      await sendPasswordResetEmail(user.email, user.full_name, resetToken, frontendUrl);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      // Don't fail the request if email fails, but log it
    }

    res.json({ message });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Find user with valid reset token
    const [users] = await db.execute(
      'SELECT id, email, full_name FROM users WHERE reset_token = ? AND reset_token_expiry > NOW() AND is_active = TRUE',
      [token]
    );

    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const user = users[0];

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password and clear reset token
    await db.execute(
      'UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?',
      [hashedPassword, user.id]
    );

    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const validateResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }

    // Check if token exists and is valid
    const [users] = await db.execute(
      'SELECT id FROM users WHERE reset_token = ? AND reset_token_expiry > NOW() AND is_active = TRUE',
      [token]
    );

    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    res.json({ message: 'Token is valid' });
  } catch (error) {
    console.error('Validate reset token error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};



const updateProfile = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      currentPassword,
      newPassword
    } = req.body;

    // Check if email is already taken by another user
    if (email) {
      const [existingUsers] = await db.execute(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, req.user.id]
      );

      if (existingUsers.length > 0) {
        return res.status(400).json({ message: 'Email is already in use' });
      }
    }

    let updateFields = [];
    let updateValues = [];

    // Build update query dynamically
    if (fullName) {
      updateFields.push('full_name = ?');
      updateValues.push(fullName);
    }
    if (email) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }
    if (phone !== undefined) {
      updateFields.push('phone = ?');
      updateValues.push(phone || null);
    }

    // Handle password update
    if (newPassword && currentPassword) {
      // Verify current password
      const [users] = await db.execute(
        'SELECT password FROM users WHERE id = ?',
        [req.user.id]
      );

      if (users.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      const isValidPassword = await bcrypt.compare(currentPassword, users[0].password);
      if (!isValidPassword) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12);
      updateFields.push('password = ?');
      updateValues.push(hashedPassword);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    // Update user
    updateValues.push(req.user.id);
    await db.execute(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // Get updated user info
    const [updatedUsers] = await db.execute(
      `SELECT u.id, u.email, u.full_name, u.phone, u.role, u.organization_id,
              o.name as organization_name, o.subscription_status, o.trial_end_date
       FROM users u 
       JOIN organizations o ON u.organization_id = o.id 
       WHERE u.id = ?`,
      [req.user.id]
    );

    const user = updatedUsers[0];
    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        phone: user.phone,
        role: user.role,
        organizationId: user.organization_id,
        organizationName: user.organization_name,
        subscriptionStatus: user.subscription_status,
        trialEndDate: user.trial_end_date
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateOrganization = async (req, res) => {
  try {
    const { organizationName, email, phone, address } = req.body;
console.log(req.body)
    let updateFields = [];
    let updateValues = [];

    // Build update query dynamically
    if (organizationName) {
      updateFields.push('name = ?');
      updateValues.push(organizationName);
    }
    if (email) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }
    if (phone !== undefined) {
      updateFields.push('phone = ?');
      updateValues.push(phone || null);
    }
    if (address !== undefined) {
      updateFields.push('address = ?');
      updateValues.push(address || null);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    // Update organization
    updateValues.push(req.user.organization_id);
    await db.execute(
      `UPDATE organizations SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // Get updated organization info
    const [organizations] = await db.execute(
      'SELECT id, name, email, phone, address FROM organizations WHERE id = ?',
      [req.user.organization_id]
    );

    res.json({
      message: 'Organization updated successfully',
      organization: organizations[0]
    });
  } catch (error) {
    console.error('Update organization error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};




module.exports = {
  register,
  login,
  getProfile,
  forgotPassword,
  resetPassword,
  validateResetToken,
  updateProfile,
  updateOrganization
};