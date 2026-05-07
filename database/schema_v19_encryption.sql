-- ═══════════════════════════════════════════════════════════════════════════
-- Migração v19 — Field-Level Encryption (Criptografia por campo)
-- Adiciona colunas de hash HMAC para busca em campos encriptados.
--
-- IMPORTANTE: Execute ANTES de configurar ENCRYPTION_KEY e HMAC_SECRET.
-- Após executar esta migração:
--   1. Configure ENCRYPTION_KEY e HMAC_SECRET nas variáveis de ambiente
--   2. Execute o script de re-encriptação dos dados existentes (se houver)
-- ═══════════════════════════════════════════════════════════════════════════

-- ── clientes — adiciona colunas de hash para busca exata ─────────────────
-- cpf_busca:   HMAC-SHA256 do CPF (para busca por CPF sem expor o valor)
-- email_busca: HMAC-SHA256 do e-mail (para busca por e-mail)
ALTER TABLE clientes
  ADD COLUMN IF NOT EXISTS cpf_busca   text,
  ADD COLUMN IF NOT EXISTS email_busca text;

-- ── membros_escritorio — hash de e-mail para busca ───────────────────────
ALTER TABLE membros_escritorio
  ADD COLUMN IF NOT EXISTS email_busca text;

-- ── convites_equipe — hash de e-mail para lookup no onboarding ───────────
ALTER TABLE convites_equipe
  ADD COLUMN IF NOT EXISTS email_busca text;

-- ── Índices para busca por hash (O(log n) em vez de O(n)) ────────────────
CREATE INDEX IF NOT EXISTS idx_clientes_cpf_busca
  ON clientes(cpf_busca)
  WHERE cpf_busca IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_clientes_email_busca
  ON clientes(email_busca)
  WHERE email_busca IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_membros_email_busca
  ON membros_escritorio(email_busca)
  WHERE email_busca IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_convites_email_busca
  ON convites_equipe(email_busca)
  WHERE email_busca IS NOT NULL;

-- ── Habilita pgcrypto (operações criptográficas no lado do banco) ─────────
-- Usado apenas para geração de UUIDs seguros e funções auxiliares.
-- A criptografia de campos é feita na aplicação (AES-256-GCM).
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── Comentários de documentação ───────────────────────────────────────────
COMMENT ON COLUMN clientes.cpf IS
  'CPF encriptado com AES-256-GCM (lib/cripto.ts). Formato: v1:<iv>:<tag>:<data>';
COMMENT ON COLUMN clientes.rg IS
  'RG encriptado com AES-256-GCM (lib/cripto.ts). Formato: v1:<iv>:<tag>:<data>';
COMMENT ON COLUMN clientes.email IS
  'E-mail encriptado com AES-256-GCM (lib/cripto.ts). Formato: v1:<iv>:<tag>:<data>';
COMMENT ON COLUMN clientes.telefone IS
  'Telefone encriptado com AES-256-GCM. Formato: v1:<iv>:<tag>:<data>';
COMMENT ON COLUMN clientes.whatsapp IS
  'WhatsApp encriptado com AES-256-GCM. Formato: v1:<iv>:<tag>:<data>';
COMMENT ON COLUMN clientes.endereco IS
  'Endereço encriptado com AES-256-GCM. Formato: v1:<iv>:<tag>:<data>';
COMMENT ON COLUMN clientes.cpf_busca IS
  'HMAC-SHA256 do CPF normalizado. Permite busca exata sem expor o CPF.';
COMMENT ON COLUMN clientes.email_busca IS
  'HMAC-SHA256 do e-mail normalizado. Permite busca exata sem expor o e-mail.';
COMMENT ON COLUMN membros_escritorio.email IS
  'E-mail encriptado com AES-256-GCM. Formato: v1:<iv>:<tag>:<data>';
COMMENT ON COLUMN membros_escritorio.email_busca IS
  'HMAC-SHA256 do e-mail. Usado para lookup no fluxo de convites.';
