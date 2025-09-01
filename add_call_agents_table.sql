-- Migration to add call_agents table for voice assistants
-- This is separate from ai_agents which is for WhatsApp agents

CREATE TABLE IF NOT EXISTS `call_agents` (
  `id` VARCHAR(36) NOT NULL DEFAULT (UUID()),
  `company_id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  
  -- OpenAI Transcriber settings
  `transcriber_model` VARCHAR(50) DEFAULT 'whisper-1',
  `transcriber_language` VARCHAR(10), -- e.g., 'pt', 'en'
  
  -- OpenAI Model settings
  `model` VARCHAR(50) DEFAULT 'gpt-4o',
  `temperature` DECIMAL(3, 2) DEFAULT 0.70,
  `max_tokens` INT DEFAULT 500,
  `top_p` DECIMAL(3, 2) DEFAULT 1.00,
  `frequency_penalty` DECIMAL(3, 2) DEFAULT 0.00,
  `presence_penalty` DECIMAL(3, 2) DEFAULT 0.00,
  
  -- ElevenLabs Voice settings
  `voice_id` VARCHAR(100) NOT NULL,
  `voice_model` VARCHAR(50) DEFAULT 'eleven_multilingual_v2',
  `stability` DECIMAL(3, 2) DEFAULT 0.50,
  `similarity_boost` DECIMAL(3, 2) DEFAULT 0.75,
  `style` DECIMAL(3, 2) DEFAULT 0.00,
  `use_speaker_boost` BOOLEAN DEFAULT FALSE,
  
  -- Call behavior settings
  `first_message` TEXT,
  `system_message` TEXT,
  `end_call_message` TEXT,
  `max_duration_seconds` INT DEFAULT 600,
  `interruptible` BOOLEAN DEFAULT TRUE,
  `recording_enabled` BOOLEAN DEFAULT FALSE,
  `response_delay_seconds` DECIMAL(3, 2) DEFAULT 0.40,
  `llm_request_delay_seconds` DECIMAL(3, 2) DEFAULT 0.10,
  `num_words_to_interrupt_assistant` INT,
  `max_duration_seconds_before_interrupt` INT,
  `background_sound` VARCHAR(100),
  `voicemail_message` TEXT,
  `end_call_phrases` JSON, -- Array of phrases that end the call
  `end_call_function_enabled` BOOLEAN DEFAULT FALSE,
  `dial_keypad_function_enabled` BOOLEAN DEFAULT FALSE,
  
  -- General fields
  `status` VARCHAR(20) DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`id`),
  KEY `idx_company_id` (`company_id`),
  KEY `idx_status` (`status`)
);