# Plano de Garantia da Qualidade de Software (SQA)
## Jurivox — Plataforma de Gestão Jurídica SaaS

> Baseado no **IEEE 730** (Plano de SQA), **ISO 9001:2015** e **Capítulo 16 — Pressman**  
> Versão: 2.0 | Data: 2026-05-07 | Substitui: v1.0 (ISO 9001:2000)

---

## Estrutura Normativa

Este plano adota a **ISO 9001:2015** (High Level Structure — Annex SL, 10 cláusulas), que substitui integralmente a ISO 9001:2000. Diferenças principais:

| Aspecto | ISO 9001:2000 | ISO 9001:2015 |
|---------|--------------|--------------|
| Estrutura | 8 cláusulas | 10 cláusulas (HLS/Annex SL) |
| Pensamento baseado em risco | Ação preventiva (separado) | Integrado à Cláusula 6 |
| Contexto da organização | Não obrigatório | Cláusula 4 obrigatória |
| Gestão do conhecimento | Implícita | Cláusula 7.1.6 explícita |
| Manual da qualidade | Obrigatório | Não obrigatório |
| Representante da direção | Obrigatório | Suprimido — responsabilidade da liderança |
| Ação preventiva | Procedimento separado | Absorvido pelo risco |

---

## 1. Propósito e Escopo (Cláusula 1 — ISO 9001:2015)

Este documento define o Plano de Garantia da Qualidade de Software (SQA) para a plataforma **Jurivox**, um SaaS multi-tenant de gestão jurídica construído com Next.js 16, Supabase, Clerk e Stripe.

**Objetivos:**
- Garantir que todos os artefatos de software atendam a padrões de alta qualidade
- Detectar erros antes que se tornem defeitos em produção
- Manter rastreabilidade de todos os erros, revisões e ações corretivas
- Alcançar disponibilidade ≥ 99.5% (MTBF ≥ 200h)
- Assegurar conformidade com LGPD, ISO 9001:2015 e IEEE 730

**Escopo:**
- Todo o código em `app/`, `lib/`, `components/`
- APIs públicas (`/api/v1/*`) e internas
- Integrações externas (Stripe, Clerk, Supabase, Resend)
- Banco de dados (esquema, migrações v1–v18, RLS)

---

## 2. Artefatos Gerenciados pela SQA (Cláusula 7.5 — Documented Information)

| Artefato | Localização | Padrão Aplicado |
|----------|-------------|-----------------|
| Código-fonte TypeScript | `app/`, `lib/`, `components/` | ESLint + TypeScript strict |
| Testes unitários | `tests/*.test.ts` | Vitest (cobertura ≥ 70%) |
| Testes E2E | `tests/e2e/*.spec.ts` | Playwright |
| Esquema do banco | `database/schema_v*.sql` | Migrações versionadas (v1–v18) |
| Variáveis de ambiente | `.env.local` | Validação em runtime |
| Configuração de segurança | `middleware.ts`, `vercel.json` | OWASP Top 10 |
| Documentação | `ARQUITETURA.md`, `SQA_PLAN.md` | IEEE 730 |
| Registro de riscos | `sqa_riscos` (banco) | ISO 9001:2015 Cláusula 6.1.2 |
| Conhecimento organizacional | `sqa_conhecimentos` (banco) | ISO 9001:2015 Cláusula 7.1.6 |

---

## 3. Contexto da Organização (Cláusula 4 — ISO 9001:2015)

### 3.1 Contexto Interno e Externo (Cláusula 4.1)

**Pontos fortes (internos):**
- Arquitetura multi-tenant com RLS no Supabase
- Autenticação gerenciada pelo Clerk (sem responsabilidade de senha)
- Cobertura de testes ≥ 70% nos módulos críticos

**Desafios externos:**
- Regulatório: LGPD (Lei 13.709/2018) — dados sensíveis de clientes jurídicos
- Competitivo: mercado jurídico com baixo índice de adoção de tecnologia
- Dependência de provedores externos (Clerk, Stripe, Supabase, Vercel)

### 3.2 Partes Interessadas (Cláusula 4.2)

Gerenciadas na tabela `sqa_partes_interessadas` via `registrarParteInteressada()`.

| Parte Interessada | Tipo | Necessidade Principal | Relevância |
|-------------------|------|----------------------|-----------|
| Advogados/Escritórios | cliente | Gestão de processos e prazos sem perda de dados | Alta |
| Clientes dos escritórios | cliente | Privacidade de dados (LGPD) | Alta |
| Stripe | fornecedor | Integração estável de pagamentos | Alta |
| Clerk | fornecedor | Autenticação confiável | Alta |
| Supabase | fornecedor | Disponibilidade do banco ≥ 99.9% | Alta |
| OAB / Reguladores | regulador | Confidencialidade de dados de processos | Alta |
| ANPD | regulador | Conformidade LGPD | Alta |

---

## 4. Liderança (Cláusula 5 — ISO 9001:2015)

**Responsabilidades da alta direção:**
- Aprovar e revisar este plano SQA trimestralmente
- Garantir recursos para implementação das ações corretivas
- Comunicar a importância da qualidade à equipe
- Revisar métricas de disponibilidade e satisfação mensalmente

**Política da qualidade Jurivox:**
> "Entregar software jurídico confiável, seguro e conforme a LGPD, com disponibilidade ≥ 99.5% e zero tolerância a vazamento de dados de clientes."

---

## 5. Planejamento (Cláusula 6 — ISO 9001:2015)

### 5.1 Pensamento Baseado em Risco (Cláusula 6.1.2)

Riscos são registrados na tabela `sqa_riscos` via `registrarRisco()` em `lib/sqa.ts`.

**Matriz de risco (Probabilidade × Impacto):**

| | Impacto Alto (3) | Impacto Médio (2) | Impacto Baixo (1) |
|-|-----------------|------------------|------------------|
| **Prob. Alta (3)** | 🔴 9 (alto) | 🟡 6 (médio) | 🟡 3... espera, baixo |
| **Prob. Média (2)** | 🟡 6 (médio) | 🟡 4 (médio) | 🟢 2 (baixo) |
| **Prob. Baixa (1)** | 🟡 3... baixo | 🟢 2 (baixo) | 🟢 1 (baixo) |

**Escala:** Alto = pontuação ≥ 7 | Médio = 4–6 | Baixo = 1–3

**Riscos identificados (catálogo inicial):**

| Risco | Tipo | Probabilidade | Impacto | Tratamento |
|-------|------|--------------|---------|-----------|
| Indisponibilidade Supabase | operacional | baixa | alto | mitigar (circuit-breaker) |
| Brecha LGPD — dados expostos | segurança | baixa | alto | mitigar (RLS + audit) |
| Falha no webhook Stripe | tecnico | media | alto | mitigar (retry + idempotency) |
| Expiração de certificados SSL | operacional | baixa | medio | monitorar (alerta automático) |
| Prazo jurídico perdido por bug | tecnico | baixa | alto | mitigar (testes E2E de prazos) |
| Acesso não autorizado entre tenants | segurança | baixa | alto | mitigar (RLS obrigatório) |

**Endpoint:** `GET /api/admin/sqa` — campo `riscos` e `resumo_riscos`

### 5.2 Objetivos de Qualidade (Cláusula 6.2)

| Objetivo | Meta | Medição | Frequência |
|----------|------|---------|-----------|
| Disponibilidade | ≥ 99.5% | MTBF (GET /api/health) | Contínua |
| MTTR | ≤ 4h | Tabela sqa_incidentes | Por incidente |
| Taxa de resolução de defeitos | ≥ 90% | GET /api/admin/sqa | Mensal |
| Cobertura de testes | ≥ 70% | npx vitest --coverage | Por PR |
| Erros TypeScript | 0 | npx tsc --noEmit | Por PR |
| Riscos altos abertos | 0 | sqa_riscos | Semanal |

---

## 6. Suporte (Cláusula 7 — ISO 9001:2015)

### 6.1 Padrões de Código (Cláusula 7.2 — Competência / VPS)

- **TypeScript strict mode** — `"strict": true` em `tsconfig.json`
- **ESLint** — configurado em `eslint.config.mjs`:
  - `no-floating-promises`: erro — toda Promise deve ser awaited ou tratada
  - `no-eval`, `no-implied-eval`, `no-new-func`: erro — prevenção de injection
  - `prefer-const`, `no-var`: erro — consistência e imutabilidade
  - `eqeqeq`: erro — comparação estrita sempre
  - `no-duplicate-imports`: erro — organização de imports
- **Zod v4** — validação de schema em todas as Server Actions

### 6.2 Padrões de Segurança (Cláusula 7.1.4 — Ambiente)

- **Autenticação**: Clerk v7 com `clerkMiddleware()` em `middleware.ts`
- **Autorização**: RBAC em `lib/permissoes.ts` (4 cargos, 18 módulos)
- **Isolamento multi-tenant**: RLS no Supabase (todas as tabelas)
- **Rate limiting**: `lib/rate-limit.ts` (in-memory; migrar para Upstash em produção)
- **Audit log**: `lib/audit.ts` + tabela `audit_logs`
- **Headers HTTP**: `vercel.json` (HSTS, X-Frame-Options, X-XSS-Protection, CSP)
- **API Keys**: hash SHA-256 em `lib/api-keys.ts`
- **HTML escape**: função `esc()` em todos os templates de e-mail

### 6.3 Gestão do Conhecimento Organizacional (Cláusula 7.1.6)

Conhecimentos são registrados na tabela `sqa_conhecimentos` via `registrarConhecimento()`.

| Tipo | Exemplo | Responsável |
|------|---------|------------|
| `processo` | Fluxo de onboarding de escritório | Sócio |
| `decisao` | Uso do Clerk em vez de auth própria | CTO |
| `licao_aprendida` | Rate-limit sem teto → memory leak | Dev |
| `padrao` | Todas as queries filtradas por escritorio_id | Dev |
| `arquitetura` | Diagrama de fluxo de webhook Stripe | CTO |
| `documentacao` | ARQUITETURA.md — visão geral do sistema | Equipe |

---

## 7. Operação (Cláusula 8 — ISO 9001:2015)

### 7.1 Revisões Técnicas (Cláusula 8.5 / Capítulo 15 — Pressman)

Revisões são registradas na tabela `sqa_revisoes` via `registrarRevisaoSQA()`.

| Tipo de Revisão | Frequência | Responsável |
|-----------------|-----------|-------------|
| Revisão de código (PR) | A cada merge | Todo desenvolvedor |
| Revisão de arquitetura | Trimestral | Sócio/CTO |
| Revisão de segurança | Semestral | Sócio/Admin |
| Revisão de banco de dados | A cada migração | Desenvolvedor + DBA |
| Revisão de desempenho | Mensal | Desenvolvedor |

### 7.2 Coleta e Análise de Erros/Defeitos (Seção 16.5 — Pressman)

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

### 7.3 Testes (Seção 16.3 — Pressman / Cláusula 8.5)

**Estratégia multiescalonada:**

| Nível | Ferramenta | Localização | Meta de Cobertura |
|-------|-----------|-------------|-------------------|
| Unitário | Vitest | `tests/*.test.ts` | ≥ 70% (linhas, funções, branches) |
| Integração | Vitest + Supabase | `tests/*.test.ts` | Módulos críticos |
| E2E | Playwright | `tests/e2e/*.spec.ts` | Fluxos principais |

```bash
npx vitest run --coverage   # Unitários com cobertura
npx playwright test         # E2E
npx tsc --noEmit            # Verificação de tipos
npx eslint .                # Análise estática
```

### 7.4 Não-Conformidades (Cláusula 10.2 — ISO 9001:2015)

Toda não-conformidade deve seguir o fluxo:
1. Registrar em `sqa_erros` com categoria e gravidade
2. **Graves** → resolução ≤ 24h (notificação imediata)
3. **Moderados** → resolução ≤ 7 dias
4. **Secundários** → backlog normal
5. Após correção: `status = 'corrigido'` → reteste → `status = 'verificado'`
6. Registrar ação corretiva em `sqa_revisoes`

---

## 8. Avaliação de Desempenho (Cláusula 9 — ISO 9001:2015)

### 8.1 Métricas de Código (Cláusula 9.1.1)

| Métrica | Meta | Fonte |
|---------|------|-------|
| Cobertura de testes (linhas) | ≥ 70% | `vitest --coverage` |
| Cobertura de funções | ≥ 70% | `vitest --coverage` |
| Erros TypeScript | 0 | `npx tsc --noEmit` |
| Violações ESLint (erro) | 0 | `npx eslint` |

### 8.2 Métricas de Confiabilidade (Seção 16.6 — Pressman)

| Métrica | Fórmula | Meta |
|---------|---------|------|
| MTBF | MTTF + MTTR | ≥ 200h |
| MTTF | Tempo disponível / N° incidentes | ≥ 196h |
| MTTR | Σ tempos de reparo / N° resoluções | ≤ 4h |
| Disponibilidade | MTTF / MTBF × 100% | ≥ 99.5% |

**Endpoints:** `GET /api/health` (tempo real) · `GET /api/admin/sqa` (histórico)

### 8.3 Métricas de Risco (Cláusula 9.1 — ISO 9001:2015)

| Métrica | Acompanhamento | Meta |
|---------|---------------|------|
| Riscos altos abertos | Semanal | 0 |
| Riscos médios em tratamento | Mensal | ≥ 80% com ação atribuída |
| Prazo de revisão de riscos | Trimestral | 100% revisados |

### 8.4 Auditoria Interna (Cláusula 9.2)

Auditorias são realizadas pelo `audit_log` (tabela `audit_logs`) + métricas diárias (`sqa_metricas_diarias`). Executar `consolidarMetricasDiarias()` diariamente via cron.

---

## 9. Manutenção de Registros (Cláusula 7.5 — Documented Information)

| Registro | Tabela/Local | Retenção |
|---------|-------------|---------|
| Eventos de segurança | `audit_logs` | 2 anos |
| Erros/defeitos | `sqa_erros` | 1 ano |
| Incidentes | `sqa_incidentes` | 1 ano |
| Revisões técnicas | `sqa_revisoes` | 2 anos |
| Métricas diárias | `sqa_metricas_diarias` | 6 meses |
| Riscos e oportunidades | `sqa_riscos` | 3 anos |
| Partes interessadas | `sqa_partes_interessadas` | Contínuo |
| Conhecimento organizacional | `sqa_conhecimentos` | Contínuo |

---

## 10. Melhoria Contínua (Cláusula 10 — ISO 9001:2015)

### 10.1 Ciclo PDCA Mensal

1. **Plan** — `GET /api/admin/sqa?periodo=30` — análise de Pareto + riscos abertos
2. **Do** — implementar ações corretivas nas "poucas causas vitais" (top 20%)
3. **Check** — verificar tendência em `sqa_metricas_diarias` + re-avaliar riscos
4. **Act** — fechar riscos resolvidos; registrar lição aprendida em `sqa_conhecimentos`

### 10.2 Metodologia DMAIC (Six Sigma)

- **Definir**: identificar causas vitais via análise de Pareto
- **Medir**: coletar MTBF, taxa de resolução, densidade de defeitos
- **Analisar**: correlacionar categorias de erro com módulos problemáticos
- **Aperfeiçoar**: ações corretivas nas causas vitais; mitigar riscos altos
- **Controlar**: adicionar testes que garantam que a causa não reapareça

### 10.3 Ferramentas e Métodos

| Ferramenta | Propósito | Referência |
|-----------|-----------|------------|
| TypeScript strict | Qualidade do código | Pressman 16.3.2 |
| ESLint | Padrões de programação (VPS) | Pressman 16.2 |
| Vitest | Testes unitários | Pressman 16.2 |
| Playwright | Testes E2E | Pressman 16.2 |
| `lib/sqa.ts` | Coleta de erros + riscos + conhecimento | Pressman 16.5 + ISO 9001:2015 |
| `lib/audit.ts` | Rastreabilidade de ações | Pressman 16.2 |
| `lib/observabilidade.ts` | Logging estruturado | Pressman 16.3 |
| `GET /api/health` | Disponibilidade e MTBF | Pressman 16.6 |
| `GET /api/admin/sqa` | Painel integrado SQA | ISO 9001:2015 Cláusula 9 |
| Supabase RLS | Isolamento multi-tenant | ISO 9001:2015 Cláusula 8 |
| Vercel Cron | Consolidação de métricas diárias | ISO 9001:2015 Cláusula 9.1 |

### 10.4 Papéis e Responsabilidades (Cláusula 5.3 — ISO 9001:2015)

| Papel | Responsabilidade SQA |
|-------|---------------------|
| Sócio / CTO | Aprovar plano SQA; revisões de arquitetura; métricas mensais; riscos altos |
| Desenvolvedor | Escrever testes; corrigir defeitos; registrar não-conformidades; atualizar `sqa_conhecimentos` |
| Admin | Monitorar audit logs; gerenciar permissões; responder incidentes |
| CI/CD | `tsc --noEmit` + `vitest --coverage` + `eslint` a cada PR |

---

*Próxima revisão: 2026-08-07 (trimestral) — conforme Cláusula 9.3 (Revisão pela Direção)*
