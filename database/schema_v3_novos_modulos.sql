-- =============================================
-- SCHEMA V3 — JurisFlow: Novos Módulos
-- Execute no Supabase SQL Editor após schema.sql e schema_v2
-- =============================================

-- -----------------------------------------------
-- TABELA: contratos
-- Relação comercial entre escritório e cliente
-- -----------------------------------------------
CREATE TABLE contratos (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  escritorio_id   UUID NOT NULL REFERENCES escritorios(id) ON DELETE CASCADE,
  cliente_id      UUID REFERENCES clientes(id) ON DELETE SET NULL,
  processo_id     UUID REFERENCES processos(id) ON DELETE SET NULL,

  nome            TEXT NOT NULL,
  tipo            TEXT NOT NULL DEFAULT 'fixo',
  -- fixo | hora | exito | misto

  valor_fixo      NUMERIC(12,2),       -- Para contratos do tipo fixo
  valor_hora      NUMERIC(10,2),   
      -- Para contratos por hora
  percentual_exito NUMERIC(5,2),       -- Para êxito (%)

  status          TEXT NOT NULL DEFAULT 'ativo',
  -- ativo | suspenso | encerrado

  responsavel_id  UUID REFERENCES membros_escritorio(id) ON DELETE SET NULL,
  data_inicio     DATE,
  data_fim        DATE,
  observacoes     TEXT,

  criado_em       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contratos_escritorio ON contratos(escritorio_id);
CREATE INDEX idx_contratos_cliente ON contratos(cliente_id);

-- -----------------------------------------------
-- TABELA: timesheet_lancamentos
-- Registro de horas trabalhadas por profissional
-- -----------------------------------------------
CREATE TABLE timesheet_lancamentos (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  escritorio_id   UUID NOT NULL REFERENCES escritorios(id) ON DELETE CASCADE,
  membro_id       UUID NOT NULL REFERENCES membros_escritorio(id) ON DELETE CASCADE,
  contrato_id     UUID REFERENCES contratos(id) ON DELETE SET NULL,
  processo_id     UUID REFERENCES processos(id) ON DELETE SET NULL,

  data            DATE NOT NULL,
  horas           NUMERIC(5,2) NOT NULL,
  descricao       TEXT NOT NULL,
  tipo            TEXT DEFAULT 'produtivo',
  -- produtivo | nao_produtivo

  criado_em       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_timesheet_escritorio ON timesheet_lancamentos(escritorio_id);
CREATE INDEX idx_timesheet_membro ON timesheet_lancamentos(membro_id);
CREATE INDEX idx_timesheet_data ON timesheet_lancamentos(data DESC);

-- -----------------------------------------------
-- TABELA: agenda_eventos
-- Eventos de agenda: audiências, prazos, reuniões
-- -----------------------------------------------
CREATE TABLE agenda_eventos (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  escritorio_id   UUID NOT NULL REFERENCES escritorios(id) ON DELETE CASCADE,
  processo_id     UUID REFERENCES processos(id) ON DELETE SET NULL,
  responsavel_id  UUID REFERENCES membros_escritorio(id) ON DELETE SET NULL,

  titulo          TEXT NOT NULL,
  descricao       TEXT,
  tipo            TEXT NOT NULL DEFAULT 'outro',
  -- audiencia | prazo | providencia | reuniao | outro

  data_inicio     TIMESTAMPTZ NOT NULL,
  data_fim        TIMESTAMPTZ,
  dia_todo        BOOLEAN DEFAULT FALSE,

  concluido       BOOLEAN DEFAULT FALSE,
  concluido_em    TIMESTAMPTZ,

  criado_em       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agenda_escritorio ON agenda_eventos(escritorio_id);
CREATE INDEX idx_agenda_data ON agenda_eventos(data_inicio);
CREATE INDEX idx_agenda_responsavel ON agenda_eventos(responsavel_id);

-- -----------------------------------------------
-- TABELA: contas_receber
-- Faturas e cobranças emitidas ao cliente
-- -----------------------------------------------
CREATE TABLE contas_receber (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  escritorio_id   UUID NOT NULL REFERENCES escritorios(id) ON DELETE CASCADE,
  cliente_id      UUID REFERENCES clientes(id) ON DELETE SET NULL,
  contrato_id     UUID REFERENCES contratos(id) ON DELETE SET NULL,
  processo_id     UUID REFERENCES processos(id) ON DELETE SET NULL,

  descricao       TEXT NOT NULL,
  valor           NUMERIC(12,2) NOT NULL,
  data_emissao    DATE NOT NULL DEFAULT CURRENT_DATE,
  data_vencimento DATE NOT NULL,
  data_recebimento DATE,

  status          TEXT NOT NULL DEFAULT 'aberto',
  -- aberto | recebido | vencido | cancelado

  forma_recebimento TEXT,
  -- pix | boleto | ted | dinheiro | cartao | cheque

  observacoes     TEXT,
  criado_em       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contas_receber_escritorio ON contas_receber(escritorio_id);
CREATE INDEX idx_contas_receber_status ON contas_receber(status);
CREATE INDEX idx_contas_receber_vencimento ON contas_receber(data_vencimento);

-- -----------------------------------------------
-- RLS — Row Level Security
-- -----------------------------------------------

ALTER TABLE contratos          ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheet_lancamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE agenda_eventos     ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas_receber     ENABLE ROW LEVEL SECURITY;

CREATE POLICY "acesso_proprio_escritorio" ON contratos
  FOR ALL USING (escritorio_id = get_escritorio_id());

CREATE POLICY "acesso_proprio_escritorio" ON timesheet_lancamentos
  FOR ALL USING (escritorio_id = get_escritorio_id());

CREATE POLICY "acesso_proprio_escritorio" ON agenda_eventos
  FOR ALL USING (escritorio_id = get_escritorio_id());

CREATE POLICY "acesso_proprio_escritorio" ON contas_receber
  FOR ALL USING (escritorio_id = get_escritorio_id());
