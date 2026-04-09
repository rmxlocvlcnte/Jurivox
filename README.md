# JurisFlow

Plataforma SaaS para gestao juridica de escritorios de advocacia, com:
- processos, clientes, prazos e agenda
- financeiro, contratos e timesheet
- monitoramento DataJud
- assinatura digital
- billing com Stripe

## Stack
- Next.js (App Router)
- Clerk (autenticacao)
- Supabase (Postgres + Storage)
- Stripe (assinaturas)

## Requisitos
- Node.js 20+
- npm ou pnpm
- Projeto Supabase
- Aplicacao Clerk

## Setup rapido
1. Instale dependencias:
```bash
npm install
```

2. Copie variaveis de ambiente:
```bash
cp .env.local.example .env.local
```

3. Preencha as chaves no `.env.local`.

4. Execute os schemas no Supabase na ordem:
1. `database/schema.sql`
2. `database/schema_v2_financeiro.sql`
3. `database/schema_v3_novos_modulos.sql`
4. `database/schema_v4_documentos_processo.sql`
5. `database/schema_v5_rate_limit.sql`
6. `database/schema_v6_templates_assinaturas_planos.sql`
7. `database/schema_v7_busca_fulltext.sql`
8. `database/schema_v8_hardening_convites_drift.sql`

5. Rode localmente:
```bash
npm run dev
```

Aplicacao: `http://localhost:3000`

## Scripts
- `npm run dev` - desenvolvimento
- `npm run build` - build de producao
- `npm run start` - servidor de producao
- `npm run lint` - lint
- `npm run test` - testes unitarios
- `npm run test:e2e` - smoke E2E com Playwright

## Observabilidade
- Logs estruturados de erro do cliente em `POST /api/observabilidade/erros`
- Captura client-side habilitada por `NEXT_PUBLIC_ENABLE_CLIENT_ERROR_REPORTING=true`

## Estrutura principal
- `app/` - rotas Next.js
- `lib/actions/` - server actions
- `app/api/` - APIs server-side
- `database/` - schemas SQL versionados
- `components/` - componentes React

## Observacoes de repositorio
- A pasta raiz deste repositorio e a fonte oficial da aplicacao em producao.
- Se existir uma pasta paralela antiga (ex.: `Jurisflow/`), trate como legado local e nao como app ativa.
