-- MIGRAÇÃO MANUAL PARA RESOLVER PROBLEMAS DO DRIZZLE
-- Execute este arquivo no seu banco MySQL para atualizar a estrutura

-- PASSO 1: Resolver o problema do email unique constraint
-- Primeiro, vamos verificar se há emails duplicados
SELECT email, COUNT(*) as count 
FROM users 
GROUP BY email 
HAVING COUNT(*) > 1;

-- Se houver emails duplicados, você precisa resolvê-los primeiro
-- Exemplo de como resolver (ajuste conforme necessário):
-- UPDATE users SET email = CONCAT(email, '_', id) WHERE id IN (
--     SELECT id FROM (
--         SELECT id, ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at) as rn
--         FROM users
--     ) t WHERE rn > 1
-- );

-- PASSO 2: Adicionar constraint unique no email (só depois de resolver duplicados)
-- Descomente a linha abaixo APENAS se não houver emails duplicados
-- ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);

-- PASSO 3: Criar/Verificar tabela funnel_stages
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
    
    INDEX idx_funnel_company_id (company_id),
    INDEX idx_funnel_company_order (company_id, `order`)
);

-- PASSO 4: Criar tabela customers (preparação para futuras funcionalidades)
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
    
    INDEX idx_customers_company_id (company_id),
    INDEX idx_customers_funnel_stage (funnel_stage_id),
    INDEX idx_customers_phone (phone),
    FOREIGN KEY (funnel_stage_id) REFERENCES funnel_stages(id) ON DELETE SET NULL
);

-- PASSO 5: Verificar se tudo foi criado corretamente
SELECT 'funnel_stages' as table_name, COUNT(*) as exists_check 
FROM information_schema.tables 
WHERE table_schema = DATABASE() AND table_name = 'funnel_stages'
UNION ALL
SELECT 'customers' as table_name, COUNT(*) as exists_check 
FROM information_schema.tables 
WHERE table_schema = DATABASE() AND table_name = 'customers';

-- PASSO 6: Mostrar estrutura das novas tabelas
DESCRIBE funnel_stages;
DESCRIBE customers;