-- =====================================================
-- v15: Web Push Subscriptions
-- =====================================================

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  membro_id       UUID NOT NULL REFERENCES membros_escritorio(id) ON DELETE CASCADE,
  escritorio_id   UUID NOT NULL REFERENCES escritorios(id) ON DELETE CASCADE,
  endpoint        TEXT NOT NULL,
  p256dh          TEXT,
  auth            TEXT,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (membro_id)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_escritorio ON push_subscriptions(escritorio_id);

-- RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "membro_ve_propria_sub" ON push_subscriptions
  FOR ALL USING (
    membro_id IN (
      SELECT id FROM membros_escritorio
      WHERE clerk_user_id = auth.jwt() ->> 'sub'
    )
  );
