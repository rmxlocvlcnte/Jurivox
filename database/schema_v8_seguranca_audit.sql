-- =====================================================================
-- Schema v8 — Segurança: Audit Log
-- Execute no SQL Editor do Supabase (Dashboard > SQL Editor)
-- =====================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escritorio_id uuid NOT NULL REFERENCES escritorios(id) ON DELETE CASCADE,
  membro_id     uuid REFERENCES membros_escritorio(id) ON DELETE SET NULL,
  clerk_user_id text,
  evento        text NOT NULL,
  categoria     text DEFAULT 'seguranca',
  alvo_tipo     text,
  alvo_id       text,
  ip            text,
  user_agent    text,
  metadata      jsonb DEFAULT '{}'::jsonb, 
  criado_em     timestamptz DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "escritorio_isolamento" ON audit_logs;
CREATE POLICY "escritorio_isolamento" ON audit_logs
  USING (escritorio_id = get_escritorio_id());

CREATE INDEX IF NOT EXISTS idx_audit_logs_escritorio
  ON audit_logs(escritorio_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_evento
  ON audit_logs(evento);

CREATE INDEX IF NOT EXISTS idx_audit_logs_criado_em
  ON audit_logs(criado_em DESC);
