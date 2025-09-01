-- Add call campaigns table
CREATE TABLE IF NOT EXISTS `call_campaigns` (
	`id` varchar(36) PRIMARY KEY DEFAULT (UUID()),
	`company_id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`contact_list_id` varchar(36) NOT NULL,
	`contact_list_name` varchar(255) NOT NULL,
	`assistant_id` varchar(36),
	`assistant_name` varchar(255) NOT NULL,
	`phone_number` varchar(20) NOT NULL,
	`status` varchar(20) DEFAULT 'draft',
	`started_at` timestamp,
	`completed_at` timestamp,
	`total_contacts` int DEFAULT 0,
	`completed_calls` int DEFAULT 0,
	`answered_calls` int DEFAULT 0,
	`not_answered_calls` int DEFAULT 0,
	`failed_calls` int DEFAULT 0,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);

-- Add calls table
CREATE TABLE IF NOT EXISTS `calls` (
	`id` varchar(36) PRIMARY KEY DEFAULT (UUID()),
	`campaign_id` varchar(36) NOT NULL,
	`contact_id` varchar(36) NOT NULL,
	`contact_name` varchar(255) NOT NULL,
	`customer_number` varchar(20) NOT NULL,
	`status` varchar(20) DEFAULT 'queued',
	`end_reason` varchar(50),
	`duration` int,
	`started_at` timestamp,
	`ended_at` timestamp,
	`assistant_name` varchar(255) NOT NULL,
	`recording_url` text,
	`transcript` text,
	`analysis` json,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);