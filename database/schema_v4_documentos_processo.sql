-- =============================================
-- SCHEMA V4 — Documentos por Processo
-- Execute no Supabase SQL Editor
-- =============================================

CREATE TABLE documentos_processo (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  processo_id     UUID NOT NULL REFERENCES processos(id) ON DELETE CASCADE,
  escritorio_id   UUID NOT NULL REFERENCES escritorios(id) ON DELETE CASCADE,
  nome            TEXT NOT NULL,
  tipo            TEXT NOT NULL DEFAULT 'outro',
  -- peticao | procuracao | contrato | sentenca | decisao | outro
  url_arquivo     TEXT NOT NULL,
  criado_em       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_documentos_processo ON documentos_processo(processo_id);
CREATE INDEX idx_documentos_escritorio ON documentos_processo(escritorio_id);

ALTER TABLE documentos_processo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "acesso_proprio_escritorio" ON documentos_processo
  FOR ALL USING (escritorio_id = get_escritorio_id());
