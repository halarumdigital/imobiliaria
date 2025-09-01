-- Add ElevenLabs API key column to global_configurations table
ALTER TABLE global_configurations ADD COLUMN elevenlabs_api_key TEXT;