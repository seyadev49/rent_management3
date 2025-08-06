/*
  # Add Missing Tables and Columns

  1. New Tables
    - `subscription_history` - Track subscription changes and payments
  2. New Columns
    - Add subscription_plan and subscription_price to organizations table
  3. Security
    - Maintain existing RLS policies
*/

-- Add subscription columns to organizations table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'subscription_plan'
  ) THEN
    ALTER TABLE organizations ADD COLUMN subscription_plan VARCHAR(50) DEFAULT 'trial';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'subscription_price'
  ) THEN
    ALTER TABLE organizations ADD COLUMN subscription_price DECIMAL(10,2) DEFAULT 0.00;
  END IF;
END $$;

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