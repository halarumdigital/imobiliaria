-- Script para verificar os dados da tabela properties
-- Execute este script no MySQL para diagnosticar o problema

SELECT 
    id,
    name,
    property_type,
    transaction_type,
    city,
    status,
    company_id,
    created_at
FROM properties 
WHERE status = 'active'
ORDER BY created_at DESC;

-- Verificar specifically os apartamentos
SELECT 
    COUNT(*) as total_apartamentos,
    property_type
FROM properties 
WHERE property_type = 'apartamento' AND status = 'active'
GROUP BY property_type;

-- Verificar todos os tipos de imóveis
SELECT 
    property_type,
    COUNT(*) as quantidade
FROM properties 
WHERE status = 'active'
GROUP BY property_type
ORDER BY quantidade DESC;