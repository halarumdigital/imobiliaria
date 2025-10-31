-- Execute este SQL no seu banco de dados MySQL para criar a tabela de usuários

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user'
);

-- Índice para melhorar a performance das consultas
CREATE INDEX idx_username ON users(username);
