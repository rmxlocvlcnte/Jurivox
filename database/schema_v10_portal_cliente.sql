-- =============================================
-- SCHEMA V10 — Portal do Cliente
-- Tokens de acesso para clientes visualizarem
-- seus processos sem precisar de conta Clerk
-- =============================================

CREATE TABLE IF NOT EXISTS portal_cliente_tokens (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id      UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  escritorio_id   UUID NOT NULL REFERENCES escritorios(id) ON DELETE CASCADE,
  token           TEXT NOT NULL UNIQUE,
  criado_em       TIMESTAMPTZ DEFAULT NOW(),
  expira_em       TIMESTAMPTZ NOT NULL,
  ultimo_acesso   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_portal_tokens_token ON portal_cliente_tokens(token);
CREATE INDEX IF NOT EXISTS idx_portal_tokens_cliente ON portal_cliente_tokens(cliente_id);
