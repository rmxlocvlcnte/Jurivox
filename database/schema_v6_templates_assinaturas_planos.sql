-- ============================================================
-- SCHEMA v6 — Templates de Documentos, Assinaturas Digitais,
--             Planos de Assinatura (Billing) e Configurações
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. PLANOS DE ASSINATURA
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS planos (
  id          text PRIMARY KEY,          -- 'starter', 'pro', 'enterprise'
  nome        text NOT NULL,
  descricao   text,
  preco_mensal numeric(10,2) NOT NULL,
  preco_anual  numeric(10,2),
  stripe_price_id_mensal  text,
  stripe_price_id_anual   text,
  limite_processos   integer DEFAULT 50,
  limite_clientes    integer DEFAULT 100,
  limite_membros     integer DEFAULT 3,
  tem_ia             boolean DEFAULT false,
  tem_monitoramento  boolean DEFAULT false,
  tem_assinatura_digital boolean DEFAULT false,
  ativo        boolean DEFAULT true,
  criado_em   timestamptz DEFAULT now()
);

INSERT INTO planos (id, nome, descricao, preco_mensal, preco_anual,
  limite_processos, limite_clientes, limite_membros,
  tem_ia, tem_monitoramento, tem_assinatura_digital)
VALUES
  ('starter',    'Starter',    'Para advogados autônomos',          99.90,  999.00,  30,   100,  2,  false, false, false),
  ('pro',        'Pro',        'Para escritórios em crescimento',  249.90, 2499.00, 200,   500, 10,  true,  true,  true),
  ('enterprise', 'Enterprise', 'Para grandes escritórios',         599.90, 5999.00, -1,    -1, -1,  true,  true,  true)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 2. ASSINATURAS DOS ESCRITÓRIOS (Billing)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS assinaturas_escritorio (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escritorio_id         uuid REFERENCES escritorios(id) ON DELETE CASCADE,
  plano_id              text REFERENCES planos(id) DEFAULT 'starter',
  stripe_customer_id    text UNIQUE,
  stripe_subscription_id text UNIQUE,
  status                text NOT NULL DEFAULT 'trialing'
    CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'incomplete')),
  periodo               text NOT NULL DEFAULT 'mensal' CHECK (periodo IN ('mensal', 'anual')),
  trial_termina_em      timestamptz DEFAULT (now() + interval '14 days'),
  periodo_inicio        timestamptz,
  periodo_fim           timestamptz,
  cancelar_em_fim       boolean DEFAULT false,
  criado_em             timestamptz DEFAULT now(),
  atualizado_em         timestamptz DEFAULT now()
);

ALTER TABLE assinaturas_escritorio ENABLE ROW LEVEL SECURITY;
CREATE POLICY "escritorio_isolamento" ON assinaturas_escritorio
  USING (escritorio_id = get_escritorio_id());

-- Criar assinatura trial automaticamente para novos escritórios
CREATE OR REPLACE FUNCTION criar_assinatura_trial()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO assinaturas_escritorio (escritorio_id, plano_id, status)
  VALUES (NEW.id, 'pro', 'trialing')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_criar_assinatura ON escritorios;
CREATE TRIGGER trigger_criar_assinatura
  AFTER INSERT ON escritorios
  FOR EACH ROW EXECUTE FUNCTION criar_assinatura_trial();

-- ─────────────────────────────────────────────────────────────
-- 3. TEMPLATES DE DOCUMENTOS
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS templates_documento (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escritorio_id uuid REFERENCES escritorios(id) ON DELETE CASCADE,
  nome          text NOT NULL,
  tipo          text NOT NULL DEFAULT 'outro'
    CHECK (tipo IN ('contrato', 'peticao', 'procuracao', 'notificacao', 'acordo', 'outro')),
  conteudo      text NOT NULL DEFAULT '',
  variaveis     text[] DEFAULT '{}',
  publico       boolean DEFAULT false,   -- Templates compartilhados entre escritórios
  criado_por    uuid REFERENCES membros_escritorio(id) ON DELETE SET NULL,
  criado_em     timestamptz DEFAULT now(),
  atualizado_em timestamptz DEFAULT now()
);

ALTER TABLE templates_documento ENABLE ROW LEVEL SECURITY;
CREATE POLICY "escritorio_isolamento" ON templates_documento
  USING (escritorio_id = get_escritorio_id() OR publico = true);

-- ─────────────────────────────────────────────────────────────
-- 4. DOCUMENTOS GERADOS A PARTIR DE TEMPLATES
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS documentos_gerados (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escritorio_id  uuid REFERENCES escritorios(id) ON DELETE CASCADE,
  template_id    uuid REFERENCES templates_documento(id) ON DELETE SET NULL,
  processo_id    uuid REFERENCES processos(id) ON DELETE SET NULL,
  cliente_id     uuid REFERENCES clientes(id) ON DELETE SET NULL,
  nome           text NOT NULL,
  conteudo       text NOT NULL,
  criado_por     uuid REFERENCES membros_escritorio(id) ON DELETE SET NULL,
  criado_em      timestamptz DEFAULT now()
);

ALTER TABLE documentos_gerados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "escritorio_isolamento" ON documentos_gerados
  USING (escritorio_id = get_escritorio_id());

-- ─────────────────────────────────────────────────────────────
-- 5. ASSINATURAS DIGITAIS
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS assinaturas_digitais (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escritorio_id        uuid REFERENCES escritorios(id) ON DELETE CASCADE,
  processo_id          uuid REFERENCES processos(id) ON DELETE SET NULL,
  cliente_id           uuid REFERENCES clientes(id) ON DELETE SET NULL,
  documento_gerado_id  uuid REFERENCES documentos_gerados(id) ON DELETE SET NULL,
  titulo               text NOT NULL,
  conteudo_documento   text NOT NULL,
  hash_token           text UNIQUE NOT NULL,   -- Token seguro para URL pública
  status               text NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'visualizado', 'assinado', 'recusado', 'expirado')),
  email_destinatario   text NOT NULL,
  nome_destinatario    text NOT NULL,
  mensagem             text,
  assinado_em          timestamptz,
  ip_assinatura        text,
  user_agent           text,
  expira_em            timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  criado_por           uuid REFERENCES membros_escritorio(id) ON DELETE SET NULL,
  criado_em            timestamptz DEFAULT now()
);

ALTER TABLE assinaturas_digitais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "escritorio_isolamento" ON assinaturas_digitais
  USING (escritorio_id = get_escritorio_id());

-- ─────────────────────────────────────────────────────────────
-- 6. LOG DE MONITORAMENTO DATAJUD
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS monitoramento_logs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escritorio_id  uuid REFERENCES escritorios(id) ON DELETE CASCADE,
  processo_id    uuid REFERENCES processos(id) ON DELETE CASCADE,
  numero_cnj     text NOT NULL,
  tribunal       text,
  movimentacoes_encontradas integer DEFAULT 0,
  movimentacoes_novas       integer DEFAULT 0,
  status         text NOT NULL DEFAULT 'sucesso' CHECK (status IN ('sucesso', 'erro', 'sem_dados')),
  erro_mensagem  text,
  executado_em   timestamptz DEFAULT now()
);

ALTER TABLE monitoramento_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "escritorio_isolamento" ON monitoramento_logs
  USING (escritorio_id = get_escritorio_id());

-- ─────────────────────────────────────────────────────────────
-- ÍNDICES
-- ─────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_templates_escritorio ON templates_documento(escritorio_id);
CREATE INDEX IF NOT EXISTS idx_assinaturas_digitais_hash ON assinaturas_digitais(hash_token);
CREATE INDEX IF NOT EXISTS idx_assinaturas_digitais_escritorio ON assinaturas_digitais(escritorio_id);
CREATE INDEX IF NOT EXISTS idx_assinaturas_escritorio_id ON assinaturas_escritorio(escritorio_id);
CREATE INDEX IF NOT EXISTS idx_monitoramento_logs_escritorio ON monitoramento_logs(escritorio_id);
CREATE INDEX IF NOT EXISTS idx_documentos_gerados_escritorio ON documentos_gerados(escritorio_id);
