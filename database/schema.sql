-- =============================================
-- SCHEMA DO BANCO DE DADOS — Jurivox
-- Execute este SQL no Supabase:
-- Dashboard > SQL Editor > New Query > Cole e clique em Run
-- =============================================


-- -----------------------------------------------
-- TABELA: escritorios
-- Cada escritório é um "tenant" (inquilino) do sistema
-- Um advogado pode ter seu próprio escritório ou
-- trabalhar em um escritório com vários usuários
-- -----------------------------------------------
CREATE TABLE escritorios (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome        TEXT NOT NULL,
  cnpj        TEXT,
  email       TEXT,
  telefone    TEXT,
  criado_em   TIMESTAMPTZ DEFAULT NOW()
); 

-- -----------------------------------------------
-- TABELA: membros_escritorio
-- Liga usuários (pelo ID do Clerk) a escritórios
-- Um usuário pode pertencer a um escritório
-- -----------------------------------------------
CREATE TABLE membros_escritorio (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  escritorio_id   UUID NOT NULL REFERENCES escritorios(id) ON DELETE CASCADE,
  clerk_user_id   TEXT NOT NULL UNIQUE,  -- ID vindo do Clerk
  nome            TEXT NOT NULL,
  email           TEXT NOT NULL,
  cargo           TEXT DEFAULT 'advogado', -- advogado | socio | estagiario | admin
  criado_em       TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------
-- TABELA: clientes
-- Cadastro de clientes do escritório
-- -----------------------------------------------
CREATE TABLE clientes (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  escritorio_id   UUID NOT NULL REFERENCES escritorios(id) ON DELETE CASCADE,
  nome            TEXT NOT NULL,
  cpf             TEXT,
  rg              TEXT,
  email           TEXT,
  telefone        TEXT,
  whatsapp        TEXT,
  endereco        TEXT,
  observacoes     TEXT,
  criado_em       TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em   TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------
-- TABELA: processos
-- Core do sistema — cada processo jurídico
-- -----------------------------------------------
CREATE TABLE processos (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  escritorio_id   UUID NOT NULL REFERENCES escritorios(id) ON DELETE CASCADE,
  cliente_id      UUID REFERENCES clientes(id) ON DELETE SET NULL,

  -- Dados do processo
  numero_cnj      TEXT NOT NULL,          -- Formato: 0000000-00.0000.0.00.0000
  tribunal        TEXT NOT NULL,          -- Ex: TJSP, TRT-15, TRF-3
  vara            TEXT,                   -- Ex: 3ª Vara Cível
  classe          TEXT,                   -- Ex: Ação de Indenização
  area_juridica   TEXT NOT NULL,          -- civil | criminal | trabalhista | previdenciario | tributario | outro

  -- Campos específicos por área (preenchidos conforme area_juridica)
  delegacia       TEXT,                   -- Só para Criminal
  numero_inquerito TEXT,                  -- Só para Criminal
  reclamado       TEXT,                   -- Só para Trabalhista (empresa)
  numero_beneficio TEXT,                  -- Só para Previdenciário

  -- Status e controle
  status          TEXT DEFAULT 'ativo',   -- ativo | arquivado | encerrado
  descricao       TEXT,
  responsavel_id  UUID REFERENCES membros_escritorio(id),

  criado_em       TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em   TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para busca rápida por número CNJ
CREATE INDEX idx_processos_numero_cnj ON processos(numero_cnj);
CREATE INDEX idx_processos_escritorio ON processos(escritorio_id);

-- -----------------------------------------------
-- TABELA: movimentacoes
-- Timeline de andamentos de cada processo
-- -----------------------------------------------
CREATE TABLE movimentacoes (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  processo_id     UUID NOT NULL REFERENCES processos(id) ON DELETE CASCADE,

  descricao       TEXT NOT NULL,
  tipo            TEXT DEFAULT 'andamento', -- andamento | audiencia | sentenca | despacho | prazo | outro
  data_movimentacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fonte           TEXT DEFAULT 'manual',  -- manual | datajud | pje | esaj

  criado_em       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_movimentacoes_processo ON movimentacoes(processo_id);
CREATE INDEX idx_movimentacoes_data ON movimentacoes(data_movimentacao DESC);

-- -----------------------------------------------
-- TABELA: prazos
-- Controle de prazos processuais
-- -----------------------------------------------
CREATE TABLE prazos (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  processo_id     UUID NOT NULL REFERENCES processos(id) ON DELETE CASCADE,
  escritorio_id   UUID NOT NULL REFERENCES escritorios(id) ON DELETE CASCADE,

  descricao       TEXT NOT NULL,
  data_inicio     DATE NOT NULL,
  quantidade_dias INTEGER NOT NULL,
  dias_uteis      BOOLEAN DEFAULT TRUE,   -- Se TRUE, conta só dias úteis
  data_vencimento DATE NOT NULL,          -- Calculado pela aplicação

  concluido       BOOLEAN DEFAULT FALSE,
  concluido_em    TIMESTAMPTZ,

  criado_em       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_prazos_vencimento ON prazos(data_vencimento);
CREATE INDEX idx_prazos_escritorio ON prazos(escritorio_id);

-- -----------------------------------------------
-- TABELA: documentos_cliente
-- Arquivos enviados (RG, CPF, contratos, etc.)
-- Os arquivos ficam no Supabase Storage
-- -----------------------------------------------
CREATE TABLE documentos_cliente (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id      UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  escritorio_id   UUID NOT NULL REFERENCES escritorios(id) ON DELETE CASCADE,

  nome            TEXT NOT NULL,          -- Nome amigável (ex: "RG - Frente")
  tipo            TEXT NOT NULL,          -- rg | cpf | contrato | procuracao | outro
  url_arquivo     TEXT NOT NULL,          -- URL do arquivo no Supabase Storage
  tamanho_bytes   INTEGER,

  criado_em       TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------
-- ROW LEVEL SECURITY (RLS)
-- A linha de defesa contra vazamento de dados entre escritórios
-- Garante que um advogado NUNCA veja dados de outro escritório
-- -----------------------------------------------

ALTER TABLE escritorios         ENABLE ROW LEVEL SECURITY;
ALTER TABLE membros_escritorio  ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE processos           ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimentacoes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE prazos              ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos_cliente  ENABLE ROW LEVEL SECURITY;

-- Função auxiliar: retorna o escritorio_id do usuário logado
-- O clerk_user_id vem do token JWT que o Clerk envia
CREATE OR REPLACE FUNCTION get_escritorio_id()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT escritorio_id
  FROM membros_escritorio
  WHERE clerk_user_id = auth.jwt() ->> 'sub'
  LIMIT 1;
$$;

-- Políticas RLS: cada tabela só retorna dados do escritório do usuário logado

CREATE POLICY "acesso_proprio_escritorio" ON clientes
  FOR ALL USING (escritorio_id = get_escritorio_id());

CREATE POLICY "acesso_proprio_escritorio" ON processos
  FOR ALL USING (escritorio_id = get_escritorio_id());

CREATE POLICY "acesso_via_processo" ON movimentacoes
  FOR ALL USING (
    processo_id IN (
      SELECT id FROM processos WHERE escritorio_id = get_escritorio_id()
    )
  );

CREATE POLICY "acesso_proprio_escritorio" ON prazos
  FOR ALL USING (escritorio_id = get_escritorio_id());

CREATE POLICY "acesso_proprio_escritorio" ON documentos_cliente
  FOR ALL USING (escritorio_id = get_escritorio_id());

CREATE POLICY "ver_proprio_membro" ON membros_escritorio
  FOR SELECT USING (escritorio_id = get_escritorio_id());
