-- =============================================
-- SCHEMA v2 — MÓDULO FINANCEIRO
-- Execute DEPOIS do schema.sql original
-- Dashboard > SQL Editor > New Query > Cole e Run
-- =============================================


-- -----------------------------------------------
-- TABELA: honorarios
-- Cada processo pode ter um contrato de honorários
-- -----------------------------------------------
-- Tipos de honorário:
-- exito     → O advogado recebe uma % quando ganha a causa
-- pro_labore → Valor fixo pela prestação do serviço
-- parcelado  → Pago em parcelas mensais
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS honorarios (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  escritorio_id   UUID NOT NULL REFERENCES escritorios(id) ON DELETE CASCADE,
  processo_id     UUID NOT NULL REFERENCES processos(id) ON DELETE CASCADE,
  cliente_id      UUID REFERENCES clientes(id) ON DELETE SET NULL,

  tipo            TEXT NOT NULL DEFAULT 'pro_labore', -- exito | pro_labore | parcelado
  valor_total     NUMERIC(12, 2) NOT NULL,
  numero_parcelas INTEGER DEFAULT 1,
  descricao       TEXT,
  status          TEXT DEFAULT 'pendente', -- pendente | parcial | quitado | cancelado

  criado_em       TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------
-- TABELA: pagamentos_honorarios
-- Cada pagamento recebido de um contrato
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS pagamentos_honorarios (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  honorario_id    UUID NOT NULL REFERENCES honorarios(id) ON DELETE CASCADE,
  escritorio_id   UUID NOT NULL REFERENCES escritorios(id) ON DELETE CASCADE,

  valor           NUMERIC(12, 2) NOT NULL,
  data_pagamento  DATE NOT NULL,
  forma_pagamento TEXT DEFAULT 'pix', -- pix | boleto | ted | dinheiro | cartao | cheque
  observacao      TEXT,

  criado_em       TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------
-- TABELA: movimentacoes_financeiras
-- Registro geral de entradas e saídas do escritório
-- (além dos honorários — ex: aluguel, luz, cópias)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS movimentacoes_financeiras (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  escritorio_id   UUID NOT NULL REFERENCES escritorios(id) ON DELETE CASCADE,

  tipo            TEXT NOT NULL,    -- 'entrada' | 'saida'
  categoria       TEXT,             -- 'Honorários', 'Custas', 'Salários', etc.
  descricao       TEXT NOT NULL,
  valor           NUMERIC(12, 2) NOT NULL,
  data            DATE NOT NULL,

  criado_em       TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para consultas financeiras rápidas
CREATE INDEX IF NOT EXISTS idx_honorarios_escritorio ON honorarios(escritorio_id);
CREATE INDEX IF NOT EXISTS idx_honorarios_processo ON honorarios(processo_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_honorario ON pagamentos_honorarios(honorario_id);
CREATE INDEX IF NOT EXISTS idx_movfin_escritorio ON movimentacoes_financeiras(escritorio_id);
CREATE INDEX IF NOT EXISTS idx_movfin_data ON movimentacoes_financeiras(data DESC);

-- -----------------------------------------------
-- ROW LEVEL SECURITY — Financeiro
-- Mesma regra: só vê dados do próprio escritório
-- -----------------------------------------------
ALTER TABLE honorarios                ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagamentos_honorarios     ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimentacoes_financeiras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "acesso_proprio_escritorio" ON honorarios
  FOR ALL USING (escritorio_id = get_escritorio_id());

CREATE POLICY "acesso_proprio_escritorio" ON pagamentos_honorarios
  FOR ALL USING (escritorio_id = get_escritorio_id());

CREATE POLICY "acesso_proprio_escritorio" ON movimentacoes_financeiras
  FOR ALL USING (escritorio_id = get_escritorio_id());
