-- Complete script to add all voice configuration and ElevenLabs API key to global_configurations table
-- Execute this script on your database

-- Add ElevenLabs API key column
ALTER TABLE global_configurations ADD COLUMN IF NOT EXISTS elevenlabs_api_key TEXT;

-- Add AI Model configuration columns  
ALTER TABLE global_configurations ADD COLUMN IF NOT EXISTS default_ai_model VARCHAR(100) DEFAULT 'gpt-4o';
ALTER TABLE global_configurations ADD COLUMN IF NOT EXISTS default_ai_temperature DECIMAL(3,2) DEFAULT 0.7;
ALTER TABLE global_configurations ADD COLUMN IF NOT EXISTS default_ai_max_tokens INT DEFAULT 500;
ALTER TABLE global_configurations ADD COLUMN IF NOT EXISTS default_ai_top_p DECIMAL(3,2) DEFAULT 1.0;
ALTER TABLE global_configurations ADD COLUMN IF NOT EXISTS default_ai_frequency_penalty DECIMAL(3,2) DEFAULT 0.0;
ALTER TABLE global_configurations ADD COLUMN IF NOT EXISTS default_ai_presence_penalty DECIMAL(3,2) DEFAULT 0.0;

-- Add Voice configuration columns
ALTER TABLE global_configurations ADD COLUMN IF NOT EXISTS default_voice_id VARCHAR(100);
ALTER TABLE global_configurations ADD COLUMN IF NOT EXISTS default_voice_model VARCHAR(50) DEFAULT 'eleven_multilingual_v2';
ALTER TABLE global_configurations ADD COLUMN IF NOT EXISTS default_voice_stability DECIMAL(3,2) DEFAULT 0.5;
ALTER TABLE global_configurations ADD COLUMN IF NOT EXISTS default_voice_similarity_boost DECIMAL(3,2) DEFAULT 0.75;
ALTER TABLE global_configurations ADD COLUMN IF NOT EXISTS default_voice_style DECIMAL(3,2) DEFAULT 0.0;
ALTER TABLE global_configurations ADD COLUMN IF NOT EXISTS default_voice_use_speaker_boost BOOLEAN DEFAULT FALSE;

-- Add Transcriber configuration columns
ALTER TABLE global_configurations ADD COLUMN IF NOT EXISTS default_transcriber_model VARCHAR(50) DEFAULT 'whisper-1';
ALTER TABLE global_configurations ADD COLUMN IF NOT EXISTS default_transcriber_language VARCHAR(10);