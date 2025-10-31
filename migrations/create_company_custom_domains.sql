-- Migration: Create company_custom_domains table
-- Description: Adds support for custom domains per company
-- Date: 2025-10-31

CREATE TABLE IF NOT EXISTS `company_custom_domains` (
  `id` VARCHAR(36) PRIMARY KEY,
  `company_id` VARCHAR(36) NOT NULL,
  `requested_domain` VARCHAR(255),
  `current_domain` VARCHAR(255),
  `status` INT NOT NULL DEFAULT 0 COMMENT '0=Pending, 1=Connected, 2=Rejected, 3=Removed',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX `idx_company_id` (`company_id`),
  INDEX `idx_requested_domain` (`requested_domain`),
  INDEX `idx_status` (`status`),

  CONSTRAINT `fk_company_custom_domains_company`
    FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
