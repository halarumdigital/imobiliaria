-- Migration: Create company_custom_domains table (SEM FOREIGN KEYS)
-- Description: Adds support for custom domains per company
-- Date: 2025-10-31

-- Criar a tabela SEM foreign keys primeiro
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
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verificar se a tabela foi criada
SELECT 'Tabela company_custom_domains criada com sucesso!' as Status;
DESCRIBE company_custom_domains;
