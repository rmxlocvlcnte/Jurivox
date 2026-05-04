# Plano de Garantia da Qualidade de Software (SQA)
## Jurivox — Plataforma de Gestão Jurídica SaaS

> Baseado no **IEEE 730** (Plano de SQA), **ISO 9001:2000** e **Capítulo 16 — Pressman**  
> Versão: 1.0 | Data: 2026-05-04

---

## 1. Propósito e Escopo

Este documento define o Plano de Garantia da Qualidade de Software (SQA) para a plataforma **Jurivox**, um SaaS multi-tenant de gestão jurídica construído com Next.js 16, Supabase, Clerk e Stripe.

**Objetivos:**
- Garantir que todos os artefatos de software atendam a padrões de alta qualidade
- Detectar erros antes que se tornem defeitos em produção
- Manter rastreabilidade de todos os erros, revisões e ações corretivas
- Alcançar disponibilidade ≥ 99.5% (MTBF ≥ 200h)
- Assegurar conformidade com LGPD e ISO 9001

**Escopo:**
- Todo o código em `app/`, `lib/`, `components/`
- APIs públicas (`/api/v1/*`) e internas
- Integrações externas (Stripe, Clerk, Supabase, Resend, Z-API)
- Banco de dados (esquema, migrações, RLS)

---

## 2. Artefatos Gerenciados pela SQA

| Artefato | Localização | Padrão Aplicado |
|----------|-------------|-----------------|
| Código-fonte TypeScript | `app/`, `lib/`, `components/` | ESLint + TypeScript strict |
| Testes unitários | `tests/*.test.ts` | Vitest (cobertura ≥ 70%) |
| Testes E2E | `tests/e2e/*.spec.ts` | Playwright |
| Esquema do banco | `database/schema_v*.sql` | Migrações versionadas (v1–v17) |
| Variáveis de ambiente | `.env.local` | Validação em runtime |
| Configuração de segurança | `middleware.ts`, `vercel.json` | OWASP Top 10 |
| Documentação | `ARQUITETURA.md`, `SQA_PLAN.md` | IEEE 730 |

---

## 3. Padrões e Práticas Aplicados

### 3.1 Padrões de Código (VPS — Violação de Padrões de Programação)

- **TypeScript strict mode** — ativado em `tsconfig.json` (`"strict": true`)
- **ESLint** — configurado em `eslint.config.mjs`:
  - `no-floating-promises`: erro — toda Promise deve ser awaited ou tratada
  - `no-eval`, `no-implied-eval`, `no-new-func`: erro — prevenção de injection
  - `prefer-const`, `no-var`: erro — consistência e imutabilidade
  - `eqeqeq`: erro — comparação estrita sempre
  - `no-duplicate-imports`: erro — organização de imports
- **Zod v4** — validação de schema em todas as Server Actions

### 3.2 Padrões de Segurança (ISO 9001 — Administração da Segurança)

- **Autenticação**: Clerk v7 com `clerkMiddleware()` em `middleware.ts`
- **Autorização**: RBAC em `lib/permissoes.ts` (4 cargos, 18 módulos)
- **Isolamento multi-tenant**: RLS no Supabase (todas as tabelas)
- **Rate limiting**: `lib/rate-limit.ts` (in-memory; migrar para Upstash em produção)
- **Audit log**: `lib/audit.ts` + tabela `audit_logs`
- **Headers HTTP**: `vercel.json` (X-Frame-Options, X-XSS-Protection, CSP)
- **API Keys**: hash SHA-256 em `lib/api-keys.ts`

### 3.3 Padrões de Banco de Dados

- Migrações versionadas numericamente (`schema_v1` a `schema_v17`)
- RLS habilitado em todas as tabelas
- Índices em todas as colunas usadas em `WHERE` e `JOIN`
- `gen_random_uuid()` para PKs (sem autoincrement)

---

## 4. Ações e Tarefas da SQA

### 4.1 Revisões Técnicas (Capítulo 15 — Pressman)

Revisões são registradas na tabela `sqa_revisoes` via `registrarRevisaoSQA()`.

| Tipo de Revisão | Frequência | Responsável |
|-----------------|-----------|-------------|
| Revisão de código (PR) | A cada merge | Todo desenvolvedor |
| Revisão de arquitetura | Trimestral | Sócio/CTO |
| Revisão de segurança | Semestral | Sócio/Admin |
| Revisão de banco de dados | A cada migração | Desenvolvedor + DBA |
| Revisão de desempenho | Mensal | Desenvolvedor |

### 4.2 Coleta e Análise de Erros/Defeitos (Seção 16.5 — Pressman)

Erros são registrados com as **12 categorias de Pressman** (Figura 16.2):

| Código | Categoria | Ação Corretiva Padrão |
|--------|-----------|----------------------|
| IES | Especificações incompletas | Revisar requisitos com stakeholders |
| MCC | Má interpretação do cliente | Clarificar requisitos antes de implementar |
| IDS | Desvio intencional | Documentar desvio e obter aprovação |
| VPS | Violação de padrões | Corrigir e adicionar regra ESLint |
| EDR | Erro na representação de dados | Revisão de schema + Zod |
| ICI | Interface inconsistente | Revisar contrato de API/componente |
| EDL | Erro na lógica de projeto | Refatorar com testes cobrindo o caso |
| IET | Testes incompletos | Adicionar casos de teste faltantes |
| IID | Documentação imprecisa | Atualizar ARQUITETURA.md ou JSDoc |
| PLT | Erro de tradução projeto→código | Revisão de código + pair programming |
| HCI | Interface ambígua | Teste de usabilidade + redesign |
| MIS | Outros | Investigar causa raiz |

**Análise de Pareto** aplicada mensalmente via `analisarPareto()` em `lib/sqa.ts`:
- Identificar as categorias com > 80% dos erros (poucas causas vitais)
- Priorizar ações corretivas nas causas vitais
- Endpoint: `GET /api/admin/sqa?periodo=30`

### 4.3 Testes (Seção 16.3 — Pressman)

**Estratégia multiescalonada:**

| Nível | Ferramenta | Localização | Meta de Cobertura |
|-------|-----------|-------------|-------------------|
| Unitário | Vitest | `tests/*.test.ts` | ≥ 70% (linhas, funções, branches) |
| Integração | Vitest + Supabase | `tests/*.test.ts` | Módulos críticos |
| E2E | Playwright | `tests/e2e/*.spec.ts` | Fluxos principais |

**Módulos com cobertura obrigatória:**
- `lib/permissoes.ts` — RBAC (segurança crítica)
- `lib/limites.ts` — limites por plano (receita crítica)
- `lib/sqa.ts` — métricas de qualidade
- `lib/rate-limit.ts` — controle de abuso
- `lib/observabilidade.ts` — logging e monitoramento

**Executar:**
```bash
npx vitest run --coverage   # Unitários com cobertura
npx playwright test         # E2E
```

### 4.4 Não-Conformidades e Rastreamento (ISO 9001)

1. Toda não-conformidade deve ser registrada em `sqa_erros` com categoria e gravidade
2. Erros **graves** exigem resolução em até 24h
3. Erros **moderados** exigem resolução em até 7 dias
4. Erros **secundários** entram no backlog normal
5. Resolução confirmada muda `status` para `verificado` após re-teste

---

## 5. Métricas de Qualidade (Seção 16.3.2 — Pressman + ISO 9001)

### 5.1 Métricas de Código

| Métrica | Meta | Fonte |
|---------|------|-------|
| Cobertura de testes (linhas) | ≥ 70% | `vitest --coverage` |
| Cobertura de funções | ≥ 70% | `vitest --coverage` |
| Erros TypeScript | 0 | `npx tsc --noEmit` |
| Violações ESLint (erro) | 0 | `npx eslint` |

### 5.2 Métricas de Confiabilidade (Seção 16.6 — Pressman)

| Métrica | Fórmula | Meta |
|---------|---------|------|
| MTBF (Mean Time Between Failures) | MTTF + MTTR | ≥ 200h |
| MTTF (Mean Time To Failure) | Tempo disponível / N° incidentes | ≥ 196h |
| MTTR (Mean Time To Repair) | Soma dos tempos de reparo / N° resoluções | ≤ 4h |
| Disponibilidade | MTTF / MTBF × 100% | ≥ 99.5% |

**Endpoint de monitoramento:** `GET /api/health` — retorna MTBF/MTTF/MTTR em tempo real.

### 5.3 Métricas de Processo (Six Sigma / Pareto)

| Métrica | Acompanhamento | Meta |
|---------|---------------|------|
| Taxa de resolução de defeitos | Mensal | ≥ 90% |
| Tempo médio de resolução | Mensal | ≤ 48h (graves) |
| Densidade de defeitos | Por release | Redução de 10% ao mês |
| Revisões técnicas realizadas | Mensal | ≥ 2 por mês |

---

## 6. Ferramentas e Métodos

| Ferramenta | Propósito | Seção Pressman |
|-----------|-----------|----------------|
| TypeScript strict | Qualidade do código | 16.3.2 |
| ESLint | Padrões de programação (VPS) | 16.2 |
| Vitest | Testes unitários | 16.2 (Testes) |
| Playwright | Testes E2E | 16.2 (Testes) |
| `lib/sqa.ts` | Coleta e análise de erros | 16.5 |
| `lib/audit.ts` | Rastreabilidade de ações | 16.2 (Auditorias) |
| `lib/observabilidade.ts` | Logging estruturado | 16.3 |
| `GET /api/health` | Disponibilidade e MTBF | 16.6 |
| `GET /api/admin/sqa` | Painel de métricas SQA | 16.3.2 |
| Supabase RLS | Isolamento multi-tenant | 16.2 (Segurança) |
| Vercel Cron | Automação de monitoramento | ISO 9001 |

---

## 7. Gerenciamento de Configuração (Gerenciamento de Mudanças)

- **Banco de dados**: migrações versionadas (`database/schema_v*.sql`), aplicadas sequencialmente
- **Código**: controle via Git; branches de feature + PR obrigatório
- **Ambiente**: variáveis documentadas em `.env.local.example`; nunca commit de secrets
- **Dependências**: `package.json` versionado; atualizações revisadas antes de merge
- **API**: versão `/api/v1/*` mantida com retrocompatibilidade; breaking changes exigem nova versão

---

## 8. Manutenção de Registros (ISO 9001 — Rastreabilidade)

| Registro | Tabela/Local | Retenção |
|---------|-------------|---------|
| Eventos de segurança | `audit_logs` | 2 anos |
| Erros/defeitos | `sqa_erros` | 1 ano |
| Incidentes | `sqa_incidentes` | 1 ano |
| Revisões técnicas | `sqa_revisoes` | 2 anos |
| Métricas diárias | `sqa_metricas_diarias` | 6 meses |
| Logs de cron | `monitoramento_logs` | 90 dias |

---

## 9. Papéis e Responsabilidades

| Papel | Responsabilidade SQA |
|-------|---------------------|
| Sócio / CTO | Aprovar o plano SQA; conduzir revisões de arquitetura; acompanhar métricas mensais |
| Desenvolvedor | Escrever testes; corrigir defeitos categorizados; registrar não-conformidades |
| Admin | Monitorar audit logs; gerenciar permissões; responder incidentes |
| CI/CD (automático) | Executar `tsc --noEmit` + `vitest --coverage` + `eslint` a cada PR |

---

## 10. Melhoria Contínua (ISO 9001 — Aperfeiçoamento Contínuo)

**Ciclo mensal:**
1. Executar `GET /api/admin/sqa?periodo=30` — análise de Pareto das categorias de erro
2. Identificar as "poucas causas vitais" (top 20% que causam 80% dos erros)
3. Criar ações corretivas priorizadas para as causas vitais
4. Registrar revisão técnica via `registrarRevisaoSQA()`
5. Verificar tendência de métricas em `sqa_metricas_diarias`
6. Consolidar métricas via `consolidarMetricasDiarias()` (executar diariamente)

**Critérios de melhoria (Six Sigma — DMAIC):**
- **Definir**: identificar causas vitais via Pareto
- **Medir**: coletar métricas de MTBF, taxa de resolução, densidade de defeitos
- **Analisar**: correlacionar categorias de erro com módulos problemáticos
- **Aperfeiçoar**: implementar ações corretivas nas causas vitais
- **Controlar**: adicionar testes que garantam que a causa não reapareça

---

*Próxima revisão deste plano: 2026-08-04 (trimestral)*
