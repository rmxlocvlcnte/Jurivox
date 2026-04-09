-- ============================================================
-- SCHEMA v10 — Boletos e Cobranças via Asaas
-- Execute no SQL Editor do Supabase
-- Requer: schema.sql (v1) e schema_v2_financeiro.sql (v2)
-- ============================================================

CREATE TABLE IF NOT EXISTS boletos (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escritorio_id       uuid NOT NULL REFERENCES escritorios(id) ON DELETE CASCADE,
  cliente_id          uuid REFERENCES clientes(id) ON DELETE SET NULL,
  conta_receber_id    uuid REFERENCES contas_receber(id) ON DELETE SET NULL,

  -- Dados Asaas
  asaas_payment_id    text UNIQUE,              -- ID da cobrança no Asaas
  asaas_customer_id   text,                     -- ID do cliente no Asaas

  -- Dados da cobrança
  descricao           text NOT NULL,
  valor               numeric(10,2) NOT NULL,
  data_vencimento     date NOT NULL,
  tipo                text NOT NULL DEFAULT 'BOLETO'
    CHECK (tipo IN ('BOLETO', 'PIX')),

  -- Status sincronizado com Asaas
  status              text NOT NULL DEFAULT 'PENDING'
    CHECK (status IN (
      'PENDING', 'RECEIVED', 'CONFIRMED', 'OVERDUE',
      'REFUNDED', 'RECEIVED_IN_CASH', 'CHARGEBACK_REQUESTED', 'CANCELED'
    )),

  -- URLs e identificadores
  url_boleto          text,
  url_invoice         text,
  linha_digitavel     text,
  nosso_numero        text,

  -- Auditoria
  criado_por          uuid REFERENCES membros_escritorio(id) ON DELETE SET NULL,
  criado_em           timestamptz DEFAULT now(),
  atualizado_em       timestamptz DEFAULT now()
);

ALTER TABLE boletos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "escritorio_isolamento" ON boletos;
CREATE POLICY "escritorio_isolamento" ON boletos
  USING (escritorio_id = get_escritorio_id());

CREATE INDEX IF NOT EXISTS idx_boletos_escritorio      ON boletos(escritorio_id);
CREATE INDEX IF NOT EXISTS idx_boletos_cliente         ON boletos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_boletos_asaas_payment   ON boletos(asaas_payment_id);
CREATE INDEX IF NOT EXISTS idx_boletos_status          ON boletos(status);
CREATE INDEX IF NOT EXISTS idx_boletos_vencimento      ON boletos(data_vencimento);
