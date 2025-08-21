
-- Admin actions log table
CREATE TABLE IF NOT EXISTS `admin_actions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `admin_id` int NOT NULL,
  `action` varchar(100) NOT NULL,
  `target_type` enum('user','organization','subscription','system') NOT NULL,
  `target_id` int DEFAULT NULL,
  `details` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `admin_id` (`admin_id`),
  KEY `action` (`action`),
  KEY `target_type` (`target_type`),
  KEY `created_at` (`created_at`)
);

-- Activity logs table (if not exists)
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `organization_id` int NOT NULL,
  `action` varchar(255) NOT NULL,
  `details` text,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `organization_id` (`organization_id`),
  KEY `action` (`action`),
  KEY `created_at` (`created_at`),
  CONSTRAINT `activity_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `activity_logs_ibfk_2` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE
);

-- Update users table to include admin fields
ALTER TABLE `users` 
ADD COLUMN IF NOT EXISTS `last_login` timestamp NULL DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `is_active` boolean DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS `password_reset_required` boolean DEFAULT FALSE;

-- Update organizations table to include suspension fields
ALTER TABLE `organizations`
ADD COLUMN IF NOT EXISTS `suspension_reason` text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `last_activity` timestamp NULL DEFAULT NULL;

-- Indexes for better admin query performance
CREATE INDEX IF NOT EXISTS `idx_users_last_login` ON `users` (`last_login`);
CREATE INDEX IF NOT EXISTS `idx_users_organization_role` ON `users` (`organization_id`, `role`);
CREATE INDEX IF NOT EXISTS `idx_subscription_history_status_plan` ON `subscription_history` (`status`, `plan_id`);
CREATE INDEX IF NOT EXISTS `idx_subscription_history_org_status` ON `subscription_history` (`organization_id`, `status`);
