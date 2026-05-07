-- ═══════════════════════════════════════════════════════════════════════════
-- Migração v18 — ISO 9001:2015 (substituição da v17 baseada em ISO 9001:2000)
-- Estrutura de 10 cláusulas (High Level Structure / Annex SL)
-- Cláusula 4: Contexto da organização
-- Cláusula 6: Pensamento baseado em risco
-- Cláusula 7.1.6: Gestão do conhecimento
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Cláusula 4.2 — Partes interessadas (stakeholders) ────────────────────
CREATE TABLE IF NOT EXISTS sqa_partes_interessadas (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome          text NOT NULL,
  tipo          varchar(20) NOT NULL
                CHECK (tipo IN ('cliente','fornecedor','regulador','interno','parceiro')),
  necessidades  jsonb NOT NULL DEFAULT '[]',
  expectativas  jsonb NOT NULL DEFAULT '[]',
  relevancia    varchar(10) NOT NULL DEFAULT 'media'
                CHECK (relevancia IN ('alta','media','baixa')),
  ativo         boolean NOT NULL DEFAULT true,
  criado_em     timestamptz NOT NULL DEFAULT now(),
  monitorado_em timestamptz
);

-- ── Cláusula 6.1.2 — Riscos e oportunidades ──────────────────────────────
-- Pontuação = probabilidade × impacto (escala 1–9)
-- Níveis: alto (7-9), médio (4-6), baixo (1-3)
CREATE TABLE IF NOT EXISTS sqa_riscos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao     text NOT NULL,
  tipo          varchar(20) NOT NULL
                CHECK (tipo IN ('tecnico','operacional','seguranca','conformidade','negocio')),
  probabilidade varchar(10) NOT NULL DEFAULT 'media'
                CHECK (probabilidade IN ('alta','media','baixa')),
  impacto       varchar(10) NOT NULL DEFAULT 'medio'
                CHECK (impacto IN ('alto','medio','baixo')),
  -- Pontuação de risco = prob × impacto (STORED computed column)
  pontuacao     smallint NOT NULL GENERATED ALWAYS AS (
                  (CASE probabilidade WHEN 'alta' THEN 3 WHEN 'media' THEN 2 ELSE 1 END) *
                  (CASE impacto       WHEN 'alto' THEN 3 WHEN 'medio' THEN 2 ELSE 1 END)
                ) STORED,
  -- Nível calculado sem depender de pontuacao (outra generated column)
  nivel_risco   varchar(10) NOT NULL GENERATED ALWAYS AS (
                  CASE
                    WHEN (CASE probabilidade WHEN 'alta' THEN 3 WHEN 'media' THEN 2 ELSE 1 END) *
                         (CASE impacto       WHEN 'alto' THEN 3 WHEN 'medio' THEN 2 ELSE 1 END) >= 7 THEN 'alto'
                    WHEN (CASE probabilidade WHEN 'alta' THEN 3 WHEN 'media' THEN 2 ELSE 1 END) *
                         (CASE impacto       WHEN 'alto' THEN 3 WHEN 'medio' THEN 2 ELSE 1 END) >= 4 THEN 'medio'
                    ELSE 'baixo'
                  END
                ) STORED,
  tratamento    varchar(20) NOT NULL DEFAULT 'mitigar'
                CHECK (tratamento IN ('aceitar','mitigar','transferir','evitar')),
  acoes         jsonb NOT NULL DEFAULT '[]',
  proprietario  text,
  status        varchar(20) NOT NULL DEFAULT 'identificado'
                CHECK (status IN ('identificado','em_tratamento','monitorado','fechado')),
  prazo         date,
  registrado_em timestamptz NOT NULL DEFAULT now(),
  revisado_em   timestamptz
);

-- ── Cláusula 7.1.6 — Gestão do conhecimento organizacional ───────────────
CREATE TABLE IF NOT EXISTS sqa_conhecimentos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo        text NOT NULL,
  tipo          varchar(30) NOT NULL
                CHECK (tipo IN ('processo','decisao','licao_aprendida','padrao','documentacao','arquitetura')),
  descricao     text NOT NULL,
  responsavel   text,
  artefato_url  text,
  valido_ate    date,
  ativo         boolean NOT NULL DEFAULT true,
  criado_em     timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

-- ── Ampliar sqa_metricas_diarias com métricas ISO 9001:2015 ──────────────
ALTER TABLE sqa_metricas_diarias
  ADD COLUMN IF NOT EXISTS riscos_abertos     integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS riscos_altos       integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS oportunidades_ativas integer NOT NULL DEFAULT 0;

-- ── Índices ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_sqa_riscos_nivel      ON sqa_riscos(nivel_risco);
CREATE INDEX IF NOT EXISTS idx_sqa_riscos_status     ON sqa_riscos(status);
CREATE INDEX IF NOT EXISTS idx_sqa_riscos_tipo       ON sqa_riscos(tipo);
CREATE INDEX IF NOT EXISTS idx_sqa_riscos_pontuacao  ON sqa_riscos(pontuacao DESC);
CREATE INDEX IF NOT EXISTS idx_sqa_conhecimentos_tipo ON sqa_conhecimentos(tipo);
CREATE INDEX IF NOT EXISTS idx_sqa_partes_tipo       ON sqa_partes_interessadas(tipo);
CREATE INDEX IF NOT EXISTS idx_sqa_partes_relevancia ON sqa_partes_interessadas(relevancia);
