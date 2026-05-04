-- ═══════════════════════════════════════════════════════════════════════════
-- Migração v17 — Garantia da Qualidade de Software (SQA)
-- Baseado no Capítulo 16 (Pressman) + ISO 9001:2000 + IEEE 730
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Tabela de erros/defeitos categorizados (Figura 16.2 — Pressman) ───────
-- Categorias de erro segundo Pressman:
--   IES = Especificações incompletas ou errôneas
--   MCC = Má interpretação da comunicação do cliente
--   IDS = Desvio intencional das especificações
--   VPS = Violação dos padrões de programação
--   EDR = Erro na representação de dados
--   ICI = Interface inconsistente de componentes
--   EDL = Erro na lógica de projeto
--   IET = Testes incompletos ou errôneos
--   IID = Documentação imprecisa ou incompleta
--   PLT = Erro na tradução do projeto para código
--   HCI = Interface homem-máquina ambígua ou inconsistente
--   MIS = Outros (miscellaneous)

CREATE TABLE IF NOT EXISTS sqa_erros (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria    varchar(10) NOT NULL
               CHECK (categoria IN ('IES','MCC','IDS','VPS','EDR','ICI','EDL','IET','IID','PLT','HCI','MIS')),
  gravidade    varchar(20) NOT NULL DEFAULT 'moderado'
               CHECK (gravidade IN ('grave','moderado','secundario')),
  descricao    text NOT NULL,
  origem       text,
  status       varchar(20) NOT NULL DEFAULT 'aberto'
               CHECK (status IN ('aberto','em_analise','corrigido','verificado','fechado')),
  metadata     jsonb NOT NULL DEFAULT '{}',
  registrado_em  timestamptz NOT NULL DEFAULT now(),
  resolvido_em   timestamptz
);

-- Coluna calculada separada para compatibilidade com Supabase
ALTER TABLE sqa_erros
  ADD COLUMN IF NOT EXISTS tempo_resolucao_horas numeric(10,2)
  GENERATED ALWAYS AS (
    CASE WHEN resolvido_em IS NOT NULL
      THEN EXTRACT(EPOCH FROM (resolvido_em - registrado_em)) / 3600.0
      ELSE NULL
    END
  ) STORED;

-- ── Tabela de incidentes (para cálculo MTBF / MTTR — Seção 16.6) ─────────
CREATE TABLE IF NOT EXISTS sqa_incidentes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo        varchar(50) NOT NULL
              CHECK (tipo IN ('downtime','degraded','erro_critico','lentidao')),
  inicio      timestamptz NOT NULL DEFAULT now(),
  fim         timestamptz,
  descricao   text,
  impacto     varchar(20) NOT NULL DEFAULT 'baixo'
              CHECK (impacto IN ('critico','alto','medio','baixo')),
  resolvido   boolean NOT NULL DEFAULT false,
  metadata    jsonb NOT NULL DEFAULT '{}'
);

-- Coluna calculada para duração do incidente
ALTER TABLE sqa_incidentes
  ADD COLUMN IF NOT EXISTS duracao_segundos integer
  GENERATED ALWAYS AS (
    CASE WHEN fim IS NOT NULL
      THEN EXTRACT(EPOCH FROM (fim - inicio))::integer
      ELSE NULL
    END
  ) STORED;

-- ── Tabela de revisões técnicas (Capítulo 15 — Pressman) ─────────────────
CREATE TABLE IF NOT EXISTS sqa_revisoes (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo                varchar(50) NOT NULL
                      CHECK (tipo IN ('codigo','arquitetura','requisitos','seguranca','desempenho','banco_dados')),
  descricao           text NOT NULL,
  resultado           varchar(30) NOT NULL DEFAULT 'aprovado'
                      CHECK (resultado IN ('aprovado','aprovado_com_ressalvas','reprovado')),
  erros_encontrados   integer NOT NULL DEFAULT 0,
  nao_conformidades   jsonb NOT NULL DEFAULT '[]',
  acoes_corretivas    jsonb NOT NULL DEFAULT '[]',
  revisado_em         timestamptz NOT NULL DEFAULT now()
);

-- ── Métricas de qualidade diárias (ISO 9001 — dados e métricas) ──────────
CREATE TABLE IF NOT EXISTS sqa_metricas_diarias (
  id                         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data                       date NOT NULL DEFAULT CURRENT_DATE,
  total_erros                integer NOT NULL DEFAULT 0,
  erros_graves               integer NOT NULL DEFAULT 0,
  erros_moderados            integer NOT NULL DEFAULT 0,
  erros_secundarios          integer NOT NULL DEFAULT 0,
  tempo_medio_resolucao_horas numeric(10,2),
  disponibilidade_percentual  numeric(5,2),
  latencia_media_ms           integer,
  usuarios_ativos             integer NOT NULL DEFAULT 0,
  acoes_auditadas             integer NOT NULL DEFAULT 0,
  incidentes_abertos          integer NOT NULL DEFAULT 0,
  atualizado_em               timestamptz NOT NULL DEFAULT now(),
  UNIQUE(data)
);

-- ── Índices para performance ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_sqa_erros_categoria   ON sqa_erros(categoria);
CREATE INDEX IF NOT EXISTS idx_sqa_erros_gravidade   ON sqa_erros(gravidade);
CREATE INDEX IF NOT EXISTS idx_sqa_erros_status      ON sqa_erros(status);
CREATE INDEX IF NOT EXISTS idx_sqa_erros_registrado  ON sqa_erros(registrado_em);
CREATE INDEX IF NOT EXISTS idx_sqa_incidentes_inicio ON sqa_incidentes(inicio);
CREATE INDEX IF NOT EXISTS idx_sqa_incidentes_tipo   ON sqa_incidentes(tipo);
CREATE INDEX IF NOT EXISTS idx_sqa_metricas_data     ON sqa_metricas_diarias(data);
