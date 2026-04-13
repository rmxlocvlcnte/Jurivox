-- ============================================================
-- SCHEMA v16 — Chaves de API (Integração Externa)
-- Execute no SQL Editor do Supabase (Dashboard > SQL Editor)
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- TABELA DE CHAVES DE API
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS api_keys (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escritorio_id uuid REFERENCES escritorios(id) ON DELETE CASCADE,
  nome          text NOT NULL,
  key_hash      text UNIQUE NOT NULL,   -- SHA-256 da chave real (nunca armazene a chave bruta)
  key_preview   text NOT NULL,          -- Ex: 'jvx_live_AbCd1234...' — mostrado na UI
  escopos       text[] DEFAULT ARRAY['processos:read', 'clientes:read', 'prazos:read'],
  ativo         boolean DEFAULT true,
  ultimo_uso_em timestamptz,
  criado_por    uuid REFERENCES membros_escritorio(id) ON DELETE SET NULL,
  criado_em     timestamptz DEFAULT now()
);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "escritorio_isolamento" ON api_keys;
CREATE POLICY "escritorio_isolamento" ON api_keys
  USING (escritorio_id = get_escritorio_id());

CREATE INDEX IF NOT EXISTS idx_api_keys_escritorio ON api_keys(escritorio_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash       ON api_keys(key_hash);

-- ─────────────────────────────────────────────────────────────
-- ESCOPOS DISPONÍVEIS
-- ─────────────────────────────────────────────────────────────
--
-- processos:read   — Leitura de processos
-- processos:write  — Criar/atualizar processos
-- clientes:read    — Leitura de clientes
-- clientes:write   — Criar/atualizar clientes
-- prazos:read      — Leitura de prazos
-- prazos:write     — Criar prazos
--
-- ─────────────────────────────────────────────────────────────
