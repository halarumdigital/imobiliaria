-- Execute este script primeiro para verificar a estrutura da tabela companies
-- Copie e cole no MySQL Workbench e execute

-- 1. Verificar se a tabela companies existe
SHOW TABLES LIKE 'companies';

-- 2. Ver a estrutura completa da tabela companies
DESCRIBE companies;

-- 3. Ver os índices da tabela companies
SHOW INDEX FROM companies;

-- 4. Ver o CREATE TABLE da tabela companies (mais detalhado)
SHOW CREATE TABLE companies;
