-- Adiciona a coluna is_active à tabela api_settings
-- Esta coluna controlará se a integração com a API está ativa ou não

ALTER TABLE api_settings 
ADD COLUMN is_active BOOLEAN DEFAULT TRUE 
AFTER api_token;

-- Atualiza registros existentes para ter is_active = TRUE
UPDATE api_settings 
SET is_active = TRUE 
WHERE is_active IS NULL;
