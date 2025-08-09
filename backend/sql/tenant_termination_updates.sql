
-- Add termination fields to tenants table
ALTER TABLE tenants ADD COLUMN termination_date DATE NULL;
ALTER TABLE tenants ADD COLUMN termination_reason VARCHAR(255) NULL;
ALTER TABLE tenants ADD COLUMN termination_notes TEXT NULL;

-- Add termination fields to rental_contracts table
ALTER TABLE rental_contracts ADD COLUMN actual_end_date DATE NULL;
ALTER TABLE rental_contracts ADD COLUMN termination_reason VARCHAR(255) NULL;
ALTER TABLE rental_contracts ADD COLUMN termination_date DATE NULL;

-- Add payment due day to contracts for better overdue calculation
ALTER TABLE rental_contracts ADD COLUMN payment_due_day INT DEFAULT 1;

-- Add new notification types
ALTER TABLE notifications MODIFY COLUMN type ENUM('rent_due','lease_expiry','maintenance','payment','general','payment_reminder','payment_due_today','rent_overdue','lease_renewal_60','lease_renewal_30') NOT NULL;
