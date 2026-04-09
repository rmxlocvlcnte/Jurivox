# Guia de Instalacao - Jurivox

Siga na ordem. O sistema depende das migracoes versionadas.

## 1) Dependencias
```bash
npm install
```

## 2) Variaveis de ambiente
```bash
cp .env.local.example .env.local
```
Preencha o `.env.local` com chaves reais de:
- Clerk
- Supabase
- Stripe
- Resend
- DataJud
- e opcionalmente `NEXT_PUBLIC_ENABLE_CLIENT_ERROR_REPORTING` para captura de erros no cliente

## 3) Banco de dados (Supabase SQL Editor)
Execute os arquivos **na ordem exata**:
1. `database/schema.sql`
2. `database/schema_v2_financeiro.sql`
3. `database/schema_v3_novos_modulos.sql`
4. `database/schema_v4_documentos_processo.sql`
5. `database/schema_v5_rate_limit.sql`
6. `database/schema_v6_templates_assinaturas_planos.sql`
7. `database/schema_v7_busca_fulltext.sql`
8. `database/schema_v8_hardening_convites_drift.sql`

## 4) Rodar localmente
```bash
npm run dev
```

Acesse: `http://localhost:3000`

## 5) Verificacoes recomendadas
```bash
npm run lint
npm run build
npm run test
npm run test:e2e
```

## Problemas comuns
- `Nao autorizado` nas rotas privadas:
  - confirme chaves do Clerk e sessao ativa.
- Erro de coluna/tabela inexistente:
  - alguma migracao nao foi executada.
- Stripe nao abre checkout/portal:
  - confira `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` e price IDs.
