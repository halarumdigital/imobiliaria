-- ============================================
-- MIGRATION: Website Templates System
-- Data: 2025-10-31
-- Descrição: Cria tabelas para sistema de templates de websites
-- ============================================

-- Tabela de templates disponíveis (populada pelo sistema)
CREATE TABLE IF NOT EXISTS website_templates (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  thumbnail VARCHAR(500),
  category VARCHAR(100),
  features JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de configurações de site por empresa
CREATE TABLE IF NOT EXISTS company_websites (
  id VARCHAR(36) PRIMARY KEY,
  company_id VARCHAR(36) NOT NULL,
  template_id VARCHAR(36) NOT NULL,
  config JSON NOT NULL COMMENT 'Armazena o TemplateConfig completo',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (template_id) REFERENCES website_templates(id),

  INDEX idx_company_id (company_id),
  INDEX idx_template_id (template_id),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de corretores/agentes por empresa
CREATE TABLE IF NOT EXISTS company_agents (
  id VARCHAR(36) PRIMARY KEY,
  company_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  avatar VARCHAR(500),
  role VARCHAR(100) COMMENT 'Ex: Senior Agent, Property Specialist',
  bio TEXT,
  social_media JSON COMMENT 'LinkedIn, Instagram, etc',
  properties_sold INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,

  INDEX idx_company_id (company_id),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de depoimentos por empresa
CREATE TABLE IF NOT EXISTS company_testimonials (
  id VARCHAR(36) PRIMARY KEY,
  company_id VARCHAR(36) NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  client_avatar VARCHAR(500),
  rating INT NOT NULL DEFAULT 5 COMMENT 'Rating de 1 a 5',
  comment TEXT NOT NULL,
  property_type VARCHAR(100) COMMENT 'House, Apartment, etc',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,

  INDEX idx_company_id (company_id),
  INDEX idx_rating (rating),
  INDEX idx_active (is_active),

  CHECK (rating >= 1 AND rating <= 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Adicionar campo 'featured' à tabela properties existente (se não existir)
-- O sistema já possui uma tabela 'properties', vamos apenas adicionar o campo necessário
SET @dbname = DATABASE();
SET @tablename = "properties";
SET @columnname = "featured";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  "SELECT 1",
  CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN ", @columnname, " BOOLEAN DEFAULT FALSE COMMENT 'Se é propriedade em destaque no website', ADD INDEX idx_featured (", @columnname, ");")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- ============================================
-- SEED DATA: Inserir templates padrão
-- ============================================

INSERT INTO website_templates (id, name, description, category, features) VALUES
(
  'template-1',
  'Classic Real Estate',
  'Template clássico e elegante para imobiliárias, com seções de propriedades em destaque, corretores, depoimentos e formulário de contato.',
  'classic',
  JSON_ARRAY(
    'Busca de Propriedades',
    'Propriedades em Destaque',
    'Perfis de Corretores',
    'Depoimentos de Clientes',
    'Formulário de Contato',
    'Design Responsivo'
  )
),
(
  'template-2',
  'Modern FindHouse',
  'Template moderno e dinâmico com foco em usabilidade, busca avançada, vídeo de apresentação e integração com WhatsApp.',
  'modern',
  JSON_ARRAY(
    'Busca Avançada de Propriedades',
    'Vídeo de Apresentação',
    'Integração com WhatsApp',
    'Carregamento Dinâmico',
    'Seções de Venda e Aluguel',
    'Otimizado para Mobile'
  )
)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  category = VALUES(category),
  features = VALUES(features);

-- ============================================
-- VERIFICAÇÕES
-- ============================================

-- Para verificar se as tabelas foram criadas:
-- SHOW TABLES LIKE '%website%';
-- SHOW TABLES LIKE '%company_%';

-- Para verificar a estrutura:
-- DESCRIBE website_templates;
-- DESCRIBE company_websites;
-- DESCRIBE company_agents;
-- DESCRIBE company_testimonials;
-- SHOW COLUMNS FROM properties LIKE 'featured';

-- Para verificar os templates inseridos:
-- SELECT * FROM website_templates;
