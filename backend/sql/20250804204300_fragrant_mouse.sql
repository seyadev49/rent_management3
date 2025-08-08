-- SaaS Rent Management System Database Schema

-- Organizations table (for multi-tenancy)

CREATE TABLE organizations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    trial_start_date DATE NOT NULL,
    trial_end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    subscription_status ENUM('trial', 'active', 'suspended', 'cancelled') DEFAULT 'trial',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    organization_id INT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role ENUM('admin', 'landlord', 'tenant', 'maintenance') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Properties table
CREATE TABLE properties (
    id INT PRIMARY KEY AUTO_INCREMENT,
    organization_id INT NOT NULL,
    landlord_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    type ENUM('apartment', 'house', 'shop', 'office') NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    subcity VARCHAR(100),
    woreda VARCHAR(100),
    description TEXT,
    total_units INT DEFAULT 1,
    images JSON,
    amenities JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (landlord_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Property units table
CREATE TABLE property_units (
    id INT PRIMARY KEY AUTO_INCREMENT,
    property_id INT NOT NULL,
    unit_number VARCHAR(50) NOT NULL,
    floor_number INT,
    room_count INT,
    monthly_rent DECIMAL(10,2) NOT NULL,
    deposit DECIMAL(10,2) NOT NULL,
    is_occupied BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- Tenants table
CREATE TABLE tenants (
    id INT PRIMARY KEY AUTO_INCREMENT,
    organization_id INT NOT NULL,
    tenant_id VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    sex ENUM('Male', 'Female') NOT NULL,
    phone VARCHAR(20) NOT NULL,
    city VARCHAR(100) NOT NULL,
    subcity VARCHAR(100) NOT NULL,
    woreda VARCHAR(100) NOT NULL,
    house_no VARCHAR(50) NOT NULL,
    organization VARCHAR(255),
    
    -- Agent information
    has_agent BOOLEAN DEFAULT FALSE,
    agent_full_name VARCHAR(255),
    agent_sex ENUM('Male', 'Female'),
    agent_phone VARCHAR(20),
    agent_city VARCHAR(100),
    agent_subcity VARCHAR(100),
    agent_woreda VARCHAR(100),
    agent_house_no VARCHAR(50),
    authentication_no VARCHAR(100),
    authentication_date DATE,
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Rental contracts table
CREATE TABLE rental_contracts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    organization_id INT NOT NULL,
    property_id INT NOT NULL,
    unit_id INT NOT NULL,
    tenant_id INT NOT NULL,
    landlord_id INT NOT NULL,
    
    -- Contract details
    lease_duration INT NOT NULL, -- in months
    contract_start_date DATE NOT NULL,
    contract_end_date DATE NOT NULL,
    monthly_rent DECIMAL(10,2) NOT NULL,
    deposit DECIMAL(10,2) NOT NULL,
    payment_term INT NOT NULL, -- payment frequency in months
    rent_start_date DATE NOT NULL,
    rent_end_date DATE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    
    -- Additional payments
    eeu_payment DECIMAL(10,2) DEFAULT 0,
    water_payment DECIMAL(10,2) DEFAULT 0,
    generator_payment DECIMAL(10,2) DEFAULT 0,
    
    status ENUM('active', 'expired', 'terminated') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (unit_id) REFERENCES property_units(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (landlord_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Payments table
CREATE TABLE payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    organization_id INT NOT NULL,
    contract_id INT NOT NULL,
    tenant_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    due_date DATE NOT NULL,
    payment_type ENUM('rent', 'deposit', 'maintenance', 'other') DEFAULT 'rent',
    payment_method ENUM('cash', 'bank_transfer', 'check', 'online') DEFAULT 'cash',
    status ENUM('pending', 'paid', 'overdue', 'cancelled') DEFAULT 'pending',
    receipt_path VARCHAR(500),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (contract_id) REFERENCES rental_contracts(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Maintenance requests table
CREATE TABLE maintenance_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    organization_id INT NOT NULL,
    property_id INT NOT NULL,
    unit_id INT,
    tenant_id INT,
    assigned_to INT,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    status ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
    images JSON,
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    completion_notes TEXT,
    requested_date DATE NOT NULL,
    completed_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (unit_id) REFERENCES property_units(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);

-- Documents table
CREATE TABLE documents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    organization_id INT NOT NULL,
    entity_type ENUM('property', 'tenant', 'contract', 'maintenance') NOT NULL,
    entity_id INT NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    document_type VARCHAR(100) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT,
    uploaded_by INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Notifications table
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    organization_id INT NOT NULL,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('rent_due', 'lease_expiry', 'maintenance', 'payment', 'general') NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    scheduled_date DATETIME,
    sent_date DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert default admin user
INSERT INTO organizations (name, email, trial_start_date, trial_end_date, subscription_status) 
VALUES ('System Admin', 'admin@rentmanagement.com', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 365 DAY), 'active');

INSERT INTO users (organization_id, email, password, full_name, role) 
VALUES (1, 'admin@rentmanagement.com', '$2b$10$rQZ8fQZ8fQZ8fQZ8fQZ8fO', 'System Administrator', 'admin');