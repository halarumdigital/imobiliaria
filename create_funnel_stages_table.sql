-- Create funnel_stages table
CREATE TABLE IF NOT EXISTS funnel_stages (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    company_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) NOT NULL DEFAULT '#3B82F6',
    `order` INT NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_company_id (company_id),
    INDEX idx_company_order (company_id, `order`)
);