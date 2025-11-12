-- Adicionar campo amenities na tabela properties
ALTER TABLE properties
ADD COLUMN amenities JSON DEFAULT ('[]');

-- Remover campos obsoletos
ALTER TABLE properties
DROP COLUMN IF EXISTS has_service_area,
DROP COLUMN IF EXISTS has_social_bathroom,
DROP COLUMN IF EXISTS has_tv_room;

-- Atualizar propriedades existentes com array vazio de amenities se necessário
UPDATE properties
SET amenities = '[]'
WHERE amenities IS NULL;