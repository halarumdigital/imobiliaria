-- Add evolution_token column to whatsapp_instances table
ALTER TABLE whatsapp_instances 
ADD COLUMN evolution_token VARCHAR(500) DEFAULT NULL 
AFTER evolution_instance_id;