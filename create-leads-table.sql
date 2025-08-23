CREATE TABLE IF NOT EXISTS leads (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  company_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'new',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_company_id (company_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);
