# RentFlow - SaaS Rent Management System

A comprehensive property management system built with React, Node.js, Express, and MySQL. This system helps landlords and property managers efficiently manage their rental properties, tenants, payments, and maintenance requests.

## 🚀 Features

### Core Functionality
- **Multi-tenant SaaS Architecture**: Each organization has isolated data
- **7-day Free Trial**: New users get full access for 7 days
- **Property Management**: Add, edit, and manage multiple properties with units
- **Tenant Management**: Complete tenant profiles with agent support
- **Contract Management**: Create and manage rental agreements
- **Payment Tracking**: Record payments, track overdue amounts, generate receipts
- **Maintenance Requests**: Track and manage property maintenance
- **Document Storage**: Upload and manage important documents
- **Real-time Notifications**: System alerts for important events
- **Email Notifications**: Automated email alerts using Nodemailer

### Dashboard & Analytics
- **Comprehensive Dashboard**: Overview of properties, tenants, payments, and maintenance
- **Financial Tracking**: Monthly revenue, overdue payments, collection rates
- **Contract Monitoring**: Track expiring contracts and renewals
- **Maintenance Overview**: Status tracking for all maintenance requests

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Lucide React** for icons
- **Vite** for build tooling

### Backend
- **Node.js** with Express.js
- **MySQL** database with connection pooling
- **JWT** authentication
- **bcryptjs** for password hashing
- **Nodemailer** for email notifications
- **Multer** for file uploads

## 📋 Prerequisites

Before running this application, make sure you have:

- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- npm or yarn package manager

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd rent-management-system
```

### 2. Backend Setup

#### Install Dependencies
```bash
cd backend
npm install
```

#### Environment Configuration
Create a `.env` file in the backend directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=rent_management

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Email Configuration (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Server Configuration
PORT=5000
```

#### Database Setup
1. Create a MySQL database named `rent_management`
2. Run the SQL schema file:
```bash
mysql -u your_username -p rent_management < sql/20250804204300_fragrant_mouse.sql
mysql -u your_username -p rent_management < sql/20250804204301_add_missing_tables.sql
```

#### Start Backend Server
```bash
npm start
```
The backend will run on `http://localhost:5000`

### 3. Frontend Setup

#### Install Dependencies
```bash
cd front-end
npm install
```

#### Start Frontend Development Server
```bash
npm run dev
```
The frontend will run on `http://localhost:5173`

## 📖 User Guide

### Getting Started

#### 1. Registration
- Visit the application and click "Start your free trial"
- Fill in your organization details
- Create your admin account
- You'll receive a welcome email with trial information

#### 2. Initial Setup
After registration, set up your system:

1. **Add Properties**
   - Go to Properties → Add Property
   - Enter property details (name, type, address, units)
   - Configure unit details (rent amounts, deposits)

2. **Add Tenants**
   - Go to Tenants → Add Tenant
   - Fill in tenant information
   - Include agent details if applicable

3. **Create Contracts**
   - Go to Properties → Select Property → New Contract
   - Choose tenant and unit
   - Set lease terms and payment details
   - Configure additional payments (utilities, etc.)

### Daily Operations

#### Payment Management
1. **Record Payments**
   - Go to Payments → Record Payment
   - Select contract and enter payment details
   - System automatically updates payment status

2. **Handle Overdue Payments**
   - Use "Generate Overdue" to create overdue payment records
   - System sends automatic email reminders
   - Track collection efforts

#### Maintenance Management
1. **Create Maintenance Requests**
   - Go to Maintenance → New Request
   - Assign priority and estimated costs
   - Track progress through completion

2. **Update Request Status**
   - Mark requests as "In Progress" or "Completed"
   - Add completion notes and actual costs

#### Document Management
1. **Upload Documents**
   - Go to Documents → Upload Document
   - Associate with properties, tenants, or contracts
   - Supported formats: PDF, DOC, images

2. **Organize Documents**
   - Filter by entity type
   - Download or delete as needed

### Notifications System

#### Automatic Notifications
The system generates notifications for:
- Contract expiring within 30 days
- Overdue payments
- Maintenance request updates
- System announcements

#### Email Alerts
Automated emails are sent for:
- Welcome messages for new users
- Payment reminders
- Contract expiry notices
- Important system updates

### Subscription Management

#### Trial Period
- 7-day free trial with full access
- Trial expiry warnings in dashboard
- Automatic feature restrictions after expiry

#### Upgrading Plans
1. Click "Upgrade Now" in the sidebar
2. Choose from available plans:
   - **Basic**: $29.99/month - Up to 10 properties
   - **Professional**: $59.99/month - Up to 50 properties
   - **Enterprise**: $99.99/month - Unlimited properties
3. Select payment method and confirm

## 🔧 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Property Management
- `GET /api/properties` - List all properties
- `POST /api/properties` - Create new property
- `GET /api/properties/:id` - Get property details
- `PUT /api/properties/:id` - Update property
- `DELETE /api/properties/:id` - Delete property

### Tenant Management
- `GET /api/tenants` - List all tenants
- `POST /api/tenants` - Create new tenant
- `GET /api/tenants/:id` - Get tenant details
- `PUT /api/tenants/:id` - Update tenant
- `DELETE /api/tenants/:id` - Delete tenant

### Contract Management
- `GET /api/contracts` - List all contracts
- `POST /api/contracts` - Create new contract
- `GET /api/contracts/:id` - Get contract details
- `PUT /api/contracts/:id` - Update contract
- `DELETE /api/contracts/:id` - Delete contract

### Payment Management
- `GET /api/payments` - List all payments
- `POST /api/payments` - Record new payment
- `PUT /api/payments/:id/status` - Update payment status
- `POST /api/payments/generate-overdue` - Generate overdue payments

### Maintenance Management
- `GET /api/maintenance` - List maintenance requests
- `POST /api/maintenance` - Create maintenance request
- `PUT /api/maintenance/:id` - Update maintenance request
- `DELETE /api/maintenance/:id` - Delete maintenance request

### Document Management
- `GET /api/documents` - List documents
- `POST /api/documents/upload` - Upload document
- `GET /api/documents/download/:id` - Download document
- `DELETE /api/documents/:id` - Delete document

### Notifications
- `GET /api/notifications` - Get user notifications
- `GET /api/notifications/unread-count` - Get unread count
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/mark-all-read` - Mark all as read

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **Multi-tenant Isolation**: Organization-based data separation
- **Input Validation**: Server-side validation for all inputs
- **File Upload Security**: Restricted file types and size limits
- **SQL Injection Protection**: Parameterized queries

## 🚀 Deployment

### Production Environment Variables
```env
NODE_ENV=production
DB_HOST=your_production_db_host
DB_USER=your_production_db_user
DB_PASSWORD=your_production_db_password
SMTP_HOST=your_production_smtp_host
SMTP_USER=your_production_email
SMTP_PASS=your_production_email_password
```

### Build for Production
```bash
# Frontend
cd front-end
npm run build

# Backend
cd backend
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Email: support@rentflow.com
- Documentation: Check this README and inline code comments

## 🔄 Version History

- **v1.0.0** - Initial release with core functionality
- **v1.1.0** - Added email notifications and document management
- **v1.2.0** - Enhanced notifications system and subscription management

---

**RentFlow** - Streamlining property management for the modern landlord.