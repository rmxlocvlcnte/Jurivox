-- =====================================================================
-- Schema v7 — Busca Full-Text com suporte a Português
-- Execute no SQL Editor do Supabase (Dashboard > SQL Editor)
-- =====================================================================

-- ─── 1. CLIENTES — Índice de busca em nome, cpf e email ─────────────

ALTER TABLE clientes ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    to_tsvector('portuguese',
      coalesce(nome, '') || ' ' ||
      coalesce(cpf, '') || ' ' ||
      coalesce(email, '') || ' ' ||
      coalesce(telefone, '') || ' ' ||
      coalesce(observacoes, '')
    )
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_clientes_fts ON clientes USING GIN(fts);

-- ─── 2. PROCESSOS — Índice em número CNJ, tribunal, classe, área ────
-- Colunas reais: numero_cnj, tribunal, vara, classe, area_juridica, descricao

ALTER TABLE processos ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    to_tsvector('portuguese',
      coalesce(numero_cnj, '') || ' ' ||
      coalesce(tribunal, '') || ' ' ||
      coalesce(vara, '') || ' ' ||
      coalesce(classe, '') || ' ' ||
      coalesce(area_juridica, '') || ' ' ||
      coalesce(descricao, '')
    )
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_processos_fts ON processos USING GIN(fts);

-- ─── 3. PRAZOS — Índice em descrição ────────────────────────────────
-- Colunas reais: descricao

ALTER TABLE prazos ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    to_tsvector('portuguese',
      coalesce(descricao, '')
    )
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_prazos_fts ON prazos USING GIN(fts);

-- ─── 4. CONTRATOS — Índice em nome e observações ────────────────────
-- Colunas reais: nome, observacoes

ALTER TABLE contratos ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    to_tsvector('portuguese',
      coalesce(nome, '') || ' ' ||
      coalesce(observacoes, '')
    )
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_contratos_fts ON contratos USING GIN(fts);

-- ─── 5. AGENDA — Índice em título e descrição ───────────────────────
-- Colunas reais: titulo, descricao

ALTER TABLE agenda_eventos ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    to_tsvector('portuguese',
      coalesce(titulo, '') || ' ' ||
      coalesce(descricao, '')
    )
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_agenda_fts ON agenda_eventos USING GIN(fts);

-- ─── 6. TEMPLATES — Índice em nome e conteúdo ───────────────────────
-- Colunas reais: nome, conteudo

ALTER TABLE templates_documento ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    to_tsvector('portuguese',
      coalesce(nome, '') || ' ' ||
      coalesce(conteudo, '')
    )
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_templates_fts ON templates_documento USING GIN(fts);

-- ─── COMO USAR NA APLICAÇÃO ─────────────────────────────────────────
-- Supabase suporta textSearch() que usa estes índices:
--
-- supabase.from('clientes')
--   .select('*')
--   .textSearch('fts', termo, { type: 'websearch', config: 'portuguese' })
--
-- O tipo 'websearch' aceita termos simples, frases com aspas e operadores +/-
-- ─────────────────────────────────────────────────────────────────────
