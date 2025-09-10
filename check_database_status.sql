-- Script para verificar o status das tabelas no banco de dados
-- Execute estas queries para verificar se as tabelas estão criadas corretamente

-- 1. Verificar se a tabela funnel_stages existe
SHOW TABLES LIKE 'funnel_stages';

-- 2. Ver a estrutura da tabela funnel_stages (se existir)
DESCRIBE funnel_stages;

-- 3. Verificar se há dados na tabela funnel_stages
SELECT COUNT(*) as total_stages FROM funnel_stages;

-- 4. Listar todas as etapas do funil criadas
SELECT id, company_id, name, color, `order`, is_active, created_at 
FROM funnel_stages 
ORDER BY company_id, `order`;

-- 5. Verificar se a tabela customers existe (para futuro uso)
SHOW TABLES LIKE 'customers';

-- 6. Verificar constraint unique no email da tabela users
SHOW INDEX FROM users WHERE Column_name = 'email';

-- 7. Listar todas as tabelas do banco
SHOW TABLES;

-- 8. Verificar integridade das foreign keys (se customers existir)
-- SELECT 
--     TABLE_NAME,
--     COLUMN_NAME,
--     CONSTRAINT_NAME,
--     REFERENCED_TABLE_NAME,
--     REFERENCED_COLUMN_NAME
-- FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
-- WHERE REFERENCED_TABLE_SCHEMA = DATABASE()
--   AND REFERENCED_TABLE_NAME IS NOT NULL;