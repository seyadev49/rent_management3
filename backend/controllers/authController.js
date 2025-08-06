const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/connection');
const { sendWelcomeEmail } = require('../services/emailService');

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

module.exports = {
  register,
  login,
  getProfile
};