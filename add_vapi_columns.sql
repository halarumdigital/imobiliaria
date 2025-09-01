-- Add VAPI columns to global_configurations table
ALTER TABLE global_configurations 
ADD COLUMN vapi_public_key TEXT,
ADD COLUMN vapi_private_key TEXT;