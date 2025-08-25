const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const sendEmail = async (to, subject, html, text) => {
  try {
    const mailOptions = {
      from: `"RentFlow" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      text
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
};

const sendWelcomeEmail = async (userEmail, userName, organizationName) => {
  const subject = 'Welcome to RentFlow - Your 7-Day Trial Has Started!';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Welcome to RentFlow!</h2>
      <p>Hi ${userName},</p>
      <p>Thank you for signing up for RentFlow! Your 7-day free trial has started for <strong>${organizationName}</strong>.</p>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #1f2937; margin-top: 0;">What you can do during your trial:</h3>
        <ul style="color: #4b5563;">
          <li>Add unlimited properties and tenants</li>
          <li>Track rent payments and generate receipts</li>
          <li>Manage maintenance requests</li>
          <li>Store important documents</li>
          <li>Generate comprehensive reports</li>
        </ul>
      </div>
      
      <p>If you have any questions, feel free to reach out to our support team.</p>
      
      <p>Best regards,<br>The RentFlow Team</p>
    </div>
  `;
  
  const text = `Welcome to RentFlow! Your 7-day trial has started for ${organizationName}. You can now manage properties, tenants, payments, and more.`;
  
  return sendEmail(userEmail, subject, html, text);
};

const sendPaymentReminderEmail = async (tenantEmail, tenantName, amount, dueDate, propertyName) => {
  const subject = 'Payment Reminder - RentFlow';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">Payment Reminder</h2>
      <p>Hi ${tenantName},</p>
      <p>This is a friendly reminder that your rent payment is due.</p>
      
      <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #991b1b; margin-top: 0;">Payment Details:</h3>
        <p><strong>Property:</strong> ${propertyName}</p>
        <p><strong>Amount Due:</strong> $${amount}</p>
        <p><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>
      </div>
      
      <p>Please make your payment as soon as possible to avoid any late fees.</p>
      
      <p>Thank you,<br>Property Management</p>
    </div>
  `;
  
  const text = `Payment reminder: $${amount} due on ${new Date(dueDate).toLocaleDateString()} for ${propertyName}`;
  
  return sendEmail(tenantEmail, subject, html, text);
};

const sendContractExpiryEmail = async (landlordEmail, landlordName, tenantName, propertyName, expiryDate) => {
  const subject = 'Contract Expiring Soon - RentFlow';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #d97706;">Contract Expiring Soon</h2>
      <p>Hi ${landlordName},</p>
      <p>This is to notify you that a rental contract is expiring soon.</p>
      
      <div style="background-color: #fffbeb; border: 1px solid #fed7aa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #92400e; margin-top: 0;">Contract Details:</h3>
        <p><strong>Tenant:</strong> ${tenantName}</p>
        <p><strong>Property:</strong> ${propertyName}</p>
        <p><strong>Expiry Date:</strong> ${new Date(expiryDate).toLocaleDateString()}</p>
      </div>
      
      <p>Please contact the tenant to discuss contract renewal or make necessary arrangements.</p>
      
      <p>Best regards,<br>RentFlow System</p>
    </div>
  `;
  
  const text = `Contract expiring: ${tenantName} at ${propertyName} expires on ${new Date(expiryDate).toLocaleDateString()}`;
  
  return sendEmail(landlordEmail, subject, html, text);
};

const sendPasswordResetEmail = async (userEmail, userName, resetToken, frontendUrl) => {
  const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
  const subject = 'Password Reset - RentFlow';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Password Reset Request</h2>
      <p>Hi ${userName},</p>
      <p>You have requested to reset your password for your RentFlow account.</p>
      
      <div style="background-color: #f0f9ff; border: 1px solid #bfdbfe; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; color: #1e40af;"><strong>Click the button below to reset your password:</strong></p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
      </div>
      
      <p style="color: #6b7280; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="color: #6b7280; font-size: 14px; word-break: break-all;">${resetUrl}</p>
      
      <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p style="color: #dc2626; margin: 0; font-size: 14px;"><strong>Security Notice:</strong> This link will expire in 1 hour. If you didn't request this reset, please ignore this email.</p>
      </div>
      
      <p>Best regards,<br>The RentFlow Team</p>
    </div>
  `;
  
  const text = `Password reset requested. Click this link to reset your password: ${resetUrl} (Link expires in 1 hour)`;
  
  return sendEmail(userEmail, subject, html, text);
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendPaymentReminderEmail,
  sendContractExpiryEmail,
  sendPasswordResetEmail
};