
-- Create subscription history table
CREATE TABLE IF NOT EXISTS subscription_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    organization_id INT NOT NULL,
    plan_id VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'credit_card',
    status ENUM('active', 'cancelled', 'expired') DEFAULT 'active',
    start_date DATE DEFAULT (CURDATE()),
    end_date DATE DEFAULT (DATE_ADD(CURDATE(), INTERVAL 30 DAY)),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

