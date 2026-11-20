CREATE DATABASE IF NOT EXISTS atendimento_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE atendimento_db;

CREATE TABLE IF NOT EXISTS senhas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(10) NOT NULL,
  tipo ENUM('NORMAL', 'PREFERENCIAL') NOT NULL DEFAULT 'NORMAL',
  status ENUM('AGUARDANDO', 'CHAMANDO', 'ATENDIDA', 'CANCELADA') NOT NULL DEFAULT 'AGUARDANDO',
  guiche VARCHAR(30) NULL,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  chamado_em DATETIME NULL,
  finalizado_em DATETIME NULL,
  INDEX idx_status_tipo (status, tipo, criado_em)
);

INSERT INTO senhas (codigo, tipo, status, guiche, chamado_em)
SELECT 'N-001', 'NORMAL', 'ATENDIDA', 'Guichê 01', NOW() - INTERVAL 10 MINUTE
WHERE NOT EXISTS (SELECT 1 FROM senhas WHERE codigo = 'N-001');

INSERT INTO senhas (codigo, tipo, status, guiche, chamado_em)
SELECT 'P-001', 'PREFERENCIAL', 'CHAMANDO', 'Guichê 02', NOW()
WHERE NOT EXISTS (SELECT 1 FROM senhas WHERE codigo = 'P-001');
