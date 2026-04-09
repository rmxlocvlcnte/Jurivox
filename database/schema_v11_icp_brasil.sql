-- ============================================================
-- SCHEMA v11 — Certificados ICP-Brasil (A1/A3)
-- Armazena metadados do certificado. A chave privada NUNCA
-- é enviada ao servidor — a assinatura ocorre no browser.
-- ============================================================

CREATE TABLE IF NOT EXISTS certificados_icp (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escritorio_id     uuid NOT NULL REFERENCES escritorios(id) ON DELETE CASCADE,
  membro_id         uuid NOT NULL REFERENCES membros_escritorio(id) ON DELETE CASCADE,

  -- Metadados do certificado (extraídos no client, sem chave privada)
  tipo              text NOT NULL DEFAULT 'A1' CHECK (tipo IN ('A1', 'A3')),
  titular_nome      text NOT NULL,
  titular_cpf       text,
  titular_cnpj      text,
  emissor           text,                    -- Ex: Certisign, Serpro, Soluti, AC Caixa
  numero_serie      text,
  valido_de         timestamptz,
  valido_ate        timestamptz,

  -- Referência ao arquivo A1 no Supabase Storage (criptografado com senha do usuário)
  storage_path      text,                    -- caminho em storage/certificados/
  iv_hex            text,                    -- IV para descriptografia AES-GCM no client

  ativo             boolean DEFAULT true,
  criado_em         timestamptz DEFAULT now(),
  atualizado_em     timestamptz DEFAULT now()
);

ALTER TABLE certificados_icp ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "escritorio_isolamento" ON certificados_icp;
CREATE POLICY "escritorio_isolamento" ON certificados_icp
  USING (escritorio_id = get_escritorio_id());

-- Apenas o próprio membro vê seu certificado
DROP POLICY IF EXISTS "membro_proprio" ON certificados_icp;
CREATE POLICY "membro_proprio" ON certificados_icp
  USING (membro_id IN (
    SELECT id FROM membros_escritorio
    WHERE clerk_user_id = auth.uid()::text
  ));

CREATE INDEX IF NOT EXISTS idx_certificados_icp_escritorio ON certificados_icp(escritorio_id);
CREATE INDEX IF NOT EXISTS idx_certificados_icp_membro     ON certificados_icp(membro_id);
