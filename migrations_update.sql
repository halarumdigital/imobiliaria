-- Atualização das migrations para incluir novas funcionalidades
-- Execute este arquivo no seu banco MySQL

-- Verificar se a tabela funnel_stages já existe
CREATE TABLE IF NOT EXISTS funnel_stages (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    company_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) NOT NULL DEFAULT '#3B82F6',
    `order` INT NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_company_id (company_id),
    INDEX idx_company_order (company_id, `order`)
);

-- Para futuras funcionalidades, você pode adicionar a tabela de customers
CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    company_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    company VARCHAR(255),
    funnel_stage_id VARCHAR(36),
    last_contact DATE,
    notes TEXT,
    value DECIMAL(10,2),
    source VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_company_id (company_id),
    INDEX idx_funnel_stage (funnel_stage_id),
    INDEX idx_phone (phone),
    FOREIGN KEY (funnel_stage_id) REFERENCES funnel_stages(id) ON DELETE SET NULL
);

-- Verificar se constraint unique do email já existe
-- Se não existir, adicionar (cuidado com dados duplicados)
-- ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);

-- Comentário: A linha acima está comentada porque pode falhar se já houver emails duplicados
-- Execute apenas se tiver certeza de que não há emails duplicados na tabela users