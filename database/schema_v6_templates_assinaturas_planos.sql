-- ============================================================
-- SCHEMA v6 — Templates de Documentos, Assinaturas Digitais,
--             Planos de Assinatura (Billing) e Limites por Plano
-- Execute no SQL Editor do Supabase (Dashboard > SQL Editor)
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. PLANOS DE ASSINATURA
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS planos (
  id                     text PRIMARY KEY,          -- 'starter', 'pro', 'enterprise'
  nome                   text NOT NULL,
  descricao              text,
  preco_mensal           numeric(10,2) NOT NULL,
  preco_anual            numeric(10,2),
  stripe_price_id_mensal text,
  stripe_price_id_anual  text,
  limite_processos       integer DEFAULT 50,
  limite_clientes        integer DEFAULT 150,
  limite_membros         integer DEFAULT 2,
  limite_templates       integer DEFAULT 5,         -- -1 = ilimitado
  tem_ia                 boolean DEFAULT false,
  tem_monitoramento      boolean DEFAULT false,
  tem_assinatura_digital boolean DEFAULT false,
  ativo                  boolean DEFAULT true,
  criado_em              timestamptz DEFAULT now()
);

-- Garante a coluna limite_templates se o schema já foi aplicado anteriormente
ALTER TABLE planos ADD COLUMN IF NOT EXISTS limite_templates integer DEFAULT 5;

-- Upsert dos planos — atualiza preços e limites a cada re-execução
-- Starter:    R$ 50/mês  — R$ 500/ano  (2 meses grátis)
-- Pro:        R$150/mês  — R$1.500/ano (2 meses grátis)
-- Enterprise: R$300/mês  — R$3.000/ano (2 meses grátis)
INSERT INTO planos (
  id, nome, descricao,
  preco_mensal, preco_anual,
  limite_processos, limite_clientes, limite_membros, limite_templates,
  tem_ia, tem_monitoramento, tem_assinatura_digital
) VALUES
  ('starter',
   'Starter',
   'Para advogados autônomos',
   50.00, 500.00,
   50, 150, 2, 5,
   false, false, false),

  ('pro',
   'Pro',
   'Para escritórios em crescimento',
   150.00, 1500.00,
   500, 1000, 15, 50,
   true, true, true),

  ('enterprise',
   'Enterprise',
   'Para grandes escritórios',
   300.00, 3000.00,
   -1, -1, -1, -1,
   true, true, true)
ON CONFLICT (id) DO UPDATE SET
  nome                   = EXCLUDED.nome,
  descricao              = EXCLUDED.descricao,
  preco_mensal           = EXCLUDED.preco_mensal,
  preco_anual            = EXCLUDED.preco_anual,
  limite_processos       = EXCLUDED.limite_processos,
  limite_clientes        = EXCLUDED.limite_clientes,
  limite_membros         = EXCLUDED.limite_membros,
  limite_templates       = EXCLUDED.limite_templates,
  tem_ia                 = EXCLUDED.tem_ia,
  tem_monitoramento      = EXCLUDED.tem_monitoramento,
  tem_assinatura_digital = EXCLUDED.tem_assinatura_digital;

-- ─────────────────────────────────────────────────────────────
-- 2. ASSINATURAS DOS ESCRITÓRIOS (Billing)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS assinaturas_escritorio (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escritorio_id          uuid REFERENCES escritorios(id) ON DELETE CASCADE,
  plano_id               text REFERENCES planos(id) DEFAULT 'starter',
  stripe_customer_id     text UNIQUE,
  stripe_subscription_id text UNIQUE,
  status                 text NOT NULL DEFAULT 'trialing'
    CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'incomplete')),
  periodo                text NOT NULL DEFAULT 'mensal' CHECK (periodo IN ('mensal', 'anual')),
  trial_termina_em       timestamptz DEFAULT (now() + interval '14 days'),
  periodo_inicio         timestamptz,
  periodo_fim            timestamptz,
  cancelar_em_fim        boolean DEFAULT false,
  criado_em              timestamptz DEFAULT now(),
  atualizado_em          timestamptz DEFAULT now()
);

ALTER TABLE assinaturas_escritorio ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "escritorio_isolamento" ON assinaturas_escritorio;
CREATE POLICY "escritorio_isolamento" ON assinaturas_escritorio
  USING (escritorio_id = get_escritorio_id());

-- Trigger: cria assinatura trial automaticamente ao criar um escritório
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
-- 3. FUNÇÃO DE ENFORCEMENT DE LIMITES POR PLANO
--    Usada como BEFORE INSERT trigger nas tabelas principais.
--    -1 no limite = ilimitado.
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_verificar_limite_plano()
RETURNS TRIGGER AS $$
DECLARE
  v_plano_id   text;
  v_plano_nome text;
  v_limite     integer;
  v_contagem   integer;
  v_entidade   text;
BEGIN
  -- Descobre o plano ativo do escritório (trialing também conta como ativo)
  SELECT a.plano_id
    INTO v_plano_id
    FROM assinaturas_escritorio a
   WHERE a.escritorio_id = NEW.escritorio_id
     AND a.status IN ('active', 'trialing')
   ORDER BY a.criado_em DESC
   LIMIT 1;

  -- Sem assinatura registrada → assume Starter (mais restritivo)
  IF v_plano_id IS NULL THEN
    v_plano_id := 'starter';
  END IF;

  -- ── Seleciona limite e contagem conforme a tabela ──────────

  IF TG_TABLE_NAME = 'processos' THEN
    v_entidade := 'processos ativos';
    SELECT p.limite_processos, p.nome
      INTO v_limite, v_plano_nome
      FROM planos p WHERE p.id = v_plano_id;
    -- Arquivados não contam contra o limite
    SELECT COUNT(*) INTO v_contagem
      FROM processos
     WHERE escritorio_id = NEW.escritorio_id
       AND status != 'arquivado';

  ELSIF TG_TABLE_NAME = 'clientes' THEN
    v_entidade := 'clientes';
    SELECT p.limite_clientes, p.nome
      INTO v_limite, v_plano_nome
      FROM planos p WHERE p.id = v_plano_id;
    SELECT COUNT(*) INTO v_contagem
      FROM clientes
     WHERE escritorio_id = NEW.escritorio_id;

  ELSIF TG_TABLE_NAME = 'membros_escritorio' THEN
    v_entidade := 'membros';
    SELECT p.limite_membros, p.nome
      INTO v_limite, v_plano_nome
      FROM planos p WHERE p.id = v_plano_id;
    SELECT COUNT(*) INTO v_contagem
      FROM membros_escritorio
     WHERE escritorio_id = NEW.escritorio_id
       AND ativo = true;

  ELSIF TG_TABLE_NAME = 'templates_documento' THEN
    v_entidade := 'templates';
    SELECT p.limite_templates, p.nome
      INTO v_limite, v_plano_nome
      FROM planos p WHERE p.id = v_plano_id;
    SELECT COUNT(*) INTO v_contagem
      FROM templates_documento
     WHERE escritorio_id = NEW.escritorio_id;

  ELSE
    -- Tabela não mapeada: permite a inserção
    RETURN NEW;
  END IF;

  -- -1 = ilimitado
  IF v_limite IS NULL OR v_limite = -1 THEN
    RETURN NEW;
  END IF;

  -- Bloqueia se o limite foi atingido
  IF v_contagem >= v_limite THEN
    RAISE EXCEPTION 'LIMITE_PLANO: Você atingiu o limite de % % no plano %. Faça upgrade para continuar.',
      v_limite, v_entidade, v_plano_nome
    USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers nas tabelas criadas nos schemas anteriores (v1-v3)
DROP TRIGGER IF EXISTS trg_limite_processos ON processos;
CREATE TRIGGER trg_limite_processos
  BEFORE INSERT ON processos
  FOR EACH ROW EXECUTE FUNCTION fn_verificar_limite_plano();

DROP TRIGGER IF EXISTS trg_limite_clientes ON clientes;
CREATE TRIGGER trg_limite_clientes
  BEFORE INSERT ON clientes
  FOR EACH ROW EXECUTE FUNCTION fn_verificar_limite_plano();

DROP TRIGGER IF EXISTS trg_limite_membros ON membros_escritorio;
CREATE TRIGGER trg_limite_membros
  BEFORE INSERT ON membros_escritorio
  FOR EACH ROW EXECUTE FUNCTION fn_verificar_limite_plano();

-- ─────────────────────────────────────────────────────────────
-- 4. TEMPLATES DE DOCUMENTOS
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS templates_documento (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escritorio_id uuid REFERENCES escritorios(id) ON DELETE CASCADE,
  nome          text NOT NULL,
  tipo          text NOT NULL DEFAULT 'outro'
    CHECK (tipo IN ('contrato', 'peticao', 'procuracao', 'notificacao', 'acordo', 'outro')),
  conteudo      text NOT NULL DEFAULT '',
  variaveis     text[] DEFAULT '{}',
  publico       boolean DEFAULT false,
  criado_por    uuid REFERENCES membros_escritorio(id) ON DELETE SET NULL,
  criado_em     timestamptz DEFAULT now(),
  atualizado_em timestamptz DEFAULT now()
);

ALTER TABLE templates_documento ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "escritorio_isolamento" ON templates_documento;
CREATE POLICY "escritorio_isolamento" ON templates_documento
  USING (escritorio_id = get_escritorio_id() OR publico = true);

-- Trigger de limite para templates (criado APÓS a tabela existir)
DROP TRIGGER IF EXISTS trg_limite_templates ON templates_documento;
CREATE TRIGGER trg_limite_templates
  BEFORE INSERT ON templates_documento
  FOR EACH ROW EXECUTE FUNCTION fn_verificar_limite_plano();

-- ─────────────────────────────────────────────────────────────
-- 5. DOCUMENTOS GERADOS A PARTIR DE TEMPLATES
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS documentos_gerados (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escritorio_id uuid REFERENCES escritorios(id) ON DELETE CASCADE,
  template_id   uuid REFERENCES templates_documento(id) ON DELETE SET NULL,
  processo_id   uuid REFERENCES processos(id) ON DELETE SET NULL,
  cliente_id    uuid REFERENCES clientes(id) ON DELETE SET NULL,
  nome          text NOT NULL,
  conteudo      text NOT NULL,
  criado_por    uuid REFERENCES membros_escritorio(id) ON DELETE SET NULL,
  criado_em     timestamptz DEFAULT now()
);

ALTER TABLE documentos_gerados ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "escritorio_isolamento" ON documentos_gerados;
CREATE POLICY "escritorio_isolamento" ON documentos_gerados
  USING (escritorio_id = get_escritorio_id());

-- ─────────────────────────────────────────────────────────────
-- 6. ASSINATURAS DIGITAIS
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS assinaturas_digitais (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escritorio_id       uuid REFERENCES escritorios(id) ON DELETE CASCADE,
  processo_id         uuid REFERENCES processos(id) ON DELETE SET NULL,
  cliente_id          uuid REFERENCES clientes(id) ON DELETE SET NULL,
  documento_gerado_id uuid REFERENCES documentos_gerados(id) ON DELETE SET NULL,
  titulo              text NOT NULL,
  conteudo_documento  text NOT NULL,
  hash_token          text UNIQUE NOT NULL,   -- Token para URL pública de assinatura
  status              text NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'visualizado', 'assinado', 'recusado', 'expirado')),
  email_destinatario  text NOT NULL,
  nome_destinatario   text NOT NULL,
  mensagem            text,
  assinado_em         timestamptz,
  ip_assinatura       text,
  user_agent          text,
  expira_em           timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  criado_por          uuid REFERENCES membros_escritorio(id) ON DELETE SET NULL,
  criado_em           timestamptz DEFAULT now()
);

ALTER TABLE assinaturas_digitais ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "escritorio_isolamento" ON assinaturas_digitais;
CREATE POLICY "escritorio_isolamento" ON assinaturas_digitais
  USING (escritorio_id = get_escritorio_id());

-- ─────────────────────────────────────────────────────────────
-- 7. LOG DE MONITORAMENTO DATAJUD
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS monitoramento_logs (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escritorio_id            uuid REFERENCES escritorios(id) ON DELETE CASCADE,
  processo_id              uuid REFERENCES processos(id) ON DELETE CASCADE,
  numero_cnj               text NOT NULL,
  tribunal                 text,
  movimentacoes_encontradas integer DEFAULT 0,
  movimentacoes_novas       integer DEFAULT 0,
  status                   text NOT NULL DEFAULT 'sucesso'
    CHECK (status IN ('sucesso', 'erro', 'sem_dados')),
  erro_mensagem            text,
  executado_em             timestamptz DEFAULT now()
);

ALTER TABLE monitoramento_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "escritorio_isolamento" ON monitoramento_logs;
CREATE POLICY "escritorio_isolamento" ON monitoramento_logs
  USING (escritorio_id = get_escritorio_id());

-- ─────────────────────────────────────────────────────────────
-- 8. ÍNDICES
-- ─────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_templates_escritorio
  ON templates_documento(escritorio_id);

CREATE INDEX IF NOT EXISTS idx_assinaturas_digitais_hash
  ON assinaturas_digitais(hash_token);

CREATE INDEX IF NOT EXISTS idx_assinaturas_digitais_escritorio
  ON assinaturas_digitais(escritorio_id);

CREATE INDEX IF NOT EXISTS idx_assinaturas_escritorio_id
  ON assinaturas_escritorio(escritorio_id);

CREATE INDEX IF NOT EXISTS idx_monitoramento_logs_escritorio
  ON monitoramento_logs(escritorio_id);

CREATE INDEX IF NOT EXISTS idx_documentos_gerados_escritorio
  ON documentos_gerados(escritorio_id);

-- ─────────────────────────────────────────────────────────────
-- RESUMO DOS PLANOS
-- ─────────────────────────────────────────────────────────────
-- | Plano      | Preço/mês | Preço/ano | Processos | Clientes | Membros | Templates | IA | Monit. | Assin. |
-- |------------|-----------|-----------|-----------|----------|---------|-----------|----|--------|--------|
-- | Starter    |  R$  50   |  R$  500  |    50     |   150    |    2    |     5     | ✗  |   ✗    |   ✗    |
-- | Pro        |  R$ 150   |  R$1.500  |   500     |  1.000   |   15    |    50     | ✓  |   ✓    |   ✓    |
-- | Enterprise |  R$ 300   |  R$3.000  | ilimitado | ilimitado|ilimitado|ilimitado  | ✓  |   ✓    |   ✓    |
-- ─────────────────────────────────────────────────────────────
