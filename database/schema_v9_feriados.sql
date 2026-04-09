-- =============================================
-- SCHEMA V9 — Feriados Nacionais
-- Necessário para cálculo correto de prazos processuais
-- Execute no Supabase > SQL Editor
-- =============================================

CREATE TABLE IF NOT EXISTS feriados (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  data        DATE NOT NULL UNIQUE,
  nome        TEXT NOT NULL,
  tipo        TEXT NOT NULL DEFAULT 'nacional', -- nacional | estadual | municipal
  uf          TEXT,    -- sigla do estado, ex: SP (apenas para estaduais)
  municipio   TEXT,    -- nome do município (apenas para municipais)
  criado_em   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feriados_data ON feriados(data);
CREATE INDEX IF NOT EXISTS idx_feriados_tipo ON feriados(tipo);

-- Feriados nacionais fixos e móveis (2024-2030)
-- Feriados fixos são inseridos para todos os anos
-- Feriados móveis (Carnaval, Corpus Christi, Paixão) precisam ser calculados

INSERT INTO feriados (data, nome, tipo) VALUES
-- 2024
('2024-01-01', 'Confraternização Universal', 'nacional'),
('2024-02-12', 'Carnaval (segunda)', 'nacional'),
('2024-02-13', 'Carnaval (terça)', 'nacional'),
('2024-03-29', 'Sexta-Feira Santa', 'nacional'),
('2024-04-21', 'Tiradentes', 'nacional'),
('2024-05-01', 'Dia do Trabalho', 'nacional'),
('2024-05-30', 'Corpus Christi', 'nacional'),
('2024-09-07', 'Independência do Brasil', 'nacional'),
('2024-10-12', 'Nossa Senhora Aparecida', 'nacional'),
('2024-11-02', 'Finados', 'nacional'),
('2024-11-15', 'Proclamação da República', 'nacional'),
('2024-11-20', 'Consciência Negra', 'nacional'),
('2024-12-25', 'Natal', 'nacional'),
-- 2025
('2025-01-01', 'Confraternização Universal', 'nacional'),
('2025-03-03', 'Carnaval (segunda)', 'nacional'),
('2025-03-04', 'Carnaval (terça)', 'nacional'),
('2025-04-18', 'Sexta-Feira Santa', 'nacional'),
('2025-04-21', 'Tiradentes', 'nacional'),
('2025-05-01', 'Dia do Trabalho', 'nacional'),
('2025-06-19', 'Corpus Christi', 'nacional'),
('2025-09-07', 'Independência do Brasil', 'nacional'),
('2025-10-12', 'Nossa Senhora Aparecida', 'nacional'),
('2025-11-02', 'Finados', 'nacional'),
('2025-11-15', 'Proclamação da República', 'nacional'),
('2025-11-20', 'Consciência Negra', 'nacional'),
('2025-12-25', 'Natal', 'nacional'),
-- 2026
('2026-01-01', 'Confraternização Universal', 'nacional'),
('2026-02-16', 'Carnaval (segunda)', 'nacional'),
('2026-02-17', 'Carnaval (terça)', 'nacional'),
('2026-04-03', 'Sexta-Feira Santa', 'nacional'),
('2026-04-21', 'Tiradentes', 'nacional'),
('2026-05-01', 'Dia do Trabalho', 'nacional'),
('2026-06-04', 'Corpus Christi', 'nacional'),
('2026-09-07', 'Independência do Brasil', 'nacional'),
('2026-10-12', 'Nossa Senhora Aparecida', 'nacional'),
('2026-11-02', 'Finados', 'nacional'),
('2026-11-15', 'Proclamação da República', 'nacional'),
('2026-11-20', 'Consciência Negra', 'nacional'),
('2026-12-25', 'Natal', 'nacional'),
-- 2027
('2027-01-01', 'Confraternização Universal', 'nacional'),
('2027-02-08', 'Carnaval (segunda)', 'nacional'),
('2027-02-09', 'Carnaval (terça)', 'nacional'),
('2027-03-26', 'Sexta-Feira Santa', 'nacional'),
('2027-04-21', 'Tiradentes', 'nacional'),
('2027-05-01', 'Dia do Trabalho', 'nacional'),
('2027-05-27', 'Corpus Christi', 'nacional'),
('2027-09-07', 'Independência do Brasil', 'nacional'),
('2027-10-12', 'Nossa Senhora Aparecida', 'nacional'),
('2027-11-02', 'Finados', 'nacional'),
('2027-11-15', 'Proclamação da República', 'nacional'),
('2027-11-20', 'Consciência Negra', 'nacional'),
('2027-12-25', 'Natal', 'nacional'),
-- 2028
('2028-01-01', 'Confraternização Universal', 'nacional'),
('2028-02-28', 'Carnaval (segunda)', 'nacional'),
('2028-02-29', 'Carnaval (terça)', 'nacional'),
('2028-04-14', 'Sexta-Feira Santa', 'nacional'),
('2028-04-21', 'Tiradentes', 'nacional'),
('2028-05-01', 'Dia do Trabalho', 'nacional'),
('2028-06-15', 'Corpus Christi', 'nacional'),
('2028-09-07', 'Independência do Brasil', 'nacional'),
('2028-10-12', 'Nossa Senhora Aparecida', 'nacional'),
('2028-11-02', 'Finados', 'nacional'),
('2028-11-15', 'Proclamação da República', 'nacional'),
('2028-11-20', 'Consciência Negra', 'nacional'),
('2028-12-25', 'Natal', 'nacional')
ON CONFLICT (data) DO NOTHING;

-- Comentário para orientar o administrador
COMMENT ON TABLE feriados IS 'Feriados nacionais, estaduais e municipais para cálculo correto de prazos processuais. Adicione feriados estaduais/municipais conforme necessário.';
