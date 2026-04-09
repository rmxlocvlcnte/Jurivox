-- ============================================================
-- SCHEMA v8 - Hardening, Convites e Correcoes de Drift
-- Execute apos schema.sql + v2 + v3 + v4 + v5 + v6 + v7
-- ============================================================

-- 1) DRIFT DE COLUNAS UTILIZADAS NO CODIGO

ALTER TABLE clientes
  ADD COLUMN IF NOT EXISTS cidade TEXT,
  ADD COLUMN IF NOT EXISTS estado TEXT;

ALTER TABLE processos
  ADD COLUMN IF NOT EXISTS assunto TEXT,
  ADD COLUMN IF NOT EXISTS observacoes TEXT;

UPDATE processos
SET observacoes = descricao
WHERE observacoes IS NULL
  AND descricao IS NOT NULL;

ALTER TABLE membros_escritorio
  ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS telefone TEXT;

UPDATE membros_escritorio
SET ativo = TRUE
WHERE ativo IS NULL;

ALTER TABLE prazos
  ADD COLUMN IF NOT EXISTS responsavel_id UUID REFERENCES membros_escritorio(id) ON DELETE SET NULL;

ALTER TABLE documentos_cliente
  ADD COLUMN IF NOT EXISTS nome_arquivo TEXT,
  ADD COLUMN IF NOT EXISTS caminho_storage TEXT;

UPDATE documentos_cliente
SET nome_arquivo = COALESCE(nome_arquivo, nome)
WHERE nome_arquivo IS NULL;

ALTER TABLE assinaturas_digitais
  ADD COLUMN IF NOT EXISTS recusado_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS motivo_recusa TEXT;

-- 2) CONVITES DE EQUIPE TOKENIZADOS

CREATE TABLE IF NOT EXISTS convites_equipe (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escritorio_id           UUID NOT NULL REFERENCES escritorios(id) ON DELETE CASCADE,
  nome_convidado          TEXT NOT NULL,
  email_convidado         TEXT NOT NULL,
  cargo_convidado         TEXT NOT NULL DEFAULT 'advogado',
  token                   TEXT NOT NULL UNIQUE,
  status                  TEXT NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'aceito', 'cancelado', 'expirado')),
  expira_em               TIMESTAMPTZ NOT NULL,
  convidado_por_membro_id UUID REFERENCES membros_escritorio(id) ON DELETE SET NULL,
  aceito_em               TIMESTAMPTZ,
  aceito_por_clerk_user_id TEXT,
  criado_em               TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_convites_equipe_escritorio ON convites_equipe(escritorio_id);
CREATE INDEX IF NOT EXISTS idx_convites_equipe_status ON convites_equipe(status);
CREATE INDEX IF NOT EXISTS idx_convites_equipe_email ON convites_equipe(email_convidado);

ALTER TABLE convites_equipe ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS convites_equipe_isolamento ON convites_equipe;
CREATE POLICY convites_equipe_isolamento ON convites_equipe
  FOR ALL USING (escritorio_id = get_escritorio_id());

-- 3) TRILHA PROBATORIA DE ASSINATURAS

CREATE TABLE IF NOT EXISTS assinaturas_digitais_eventos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assinatura_id UUID NOT NULL REFERENCES assinaturas_digitais(id) ON DELETE CASCADE,
  tipo_evento   TEXT NOT NULL CHECK (tipo_evento IN ('visualizado', 'assinado', 'recusado', 'tentativa_invalida')),
  ip            TEXT,
  user_agent    TEXT,
  detalhes      TEXT,
  criado_em     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assinaturas_eventos_assinatura ON assinaturas_digitais_eventos(assinatura_id);
CREATE INDEX IF NOT EXISTS idx_assinaturas_eventos_criado_em ON assinaturas_digitais_eventos(criado_em DESC);

ALTER TABLE assinaturas_digitais_eventos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS assinaturas_eventos_isolamento ON assinaturas_digitais_eventos;
CREATE POLICY assinaturas_eventos_isolamento ON assinaturas_digitais_eventos
  FOR ALL USING (
    assinatura_id IN (
      SELECT id
      FROM assinaturas_digitais
      WHERE escritorio_id = get_escritorio_id()
    )
  );

-- 4) INDICES COMPLEMENTARES

CREATE INDEX IF NOT EXISTS idx_membros_escritorio_ativo ON membros_escritorio(escritorio_id, ativo);
CREATE INDEX IF NOT EXISTS idx_prazos_responsavel ON prazos(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_documentos_cliente_nome_arquivo ON documentos_cliente(nome_arquivo);
