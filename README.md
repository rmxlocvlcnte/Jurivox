# Jurivox — Documentação Completa & Levantamento de Requisitos

> **Plataforma SaaS Multi-Tenant de Gestão Jurídica para Escritórios de Advocacia**
> Versão: 0.1.0 | Última atualização: Maio 2026 | Licença: MIT

---

## Sumário

1. [Visão Geral do Projeto](#1-visão-geral-do-projeto)
2. [Stack Tecnológica](#2-stack-tecnológica)
3. [Arquitetura do Sistema](#3-arquitetura-do-sistema)
4. [Módulos Implementados](#4-módulos-implementados)
5. [Modelo de Dados](#5-modelo-de-dados)
6. [Levantamento de Requisitos Funcionais](#6-levantamento-de-requisitos-funcionais)
7. [Requisitos Não-Funcionais](#7-requisitos-não-funcionais)
8. [APIs e Integrações](#8-apis-e-integrações)
9. [Segurança e Conformidade](#9-segurança-e-conformidade)
10. [Testes e Qualidade](#10-testes-e-qualidade)
11. [Infraestrutura e Deploy](#11-infraestrutura-e-deploy)
12. [Status Atual do Desenvolvimento](#12-status-atual-do-desenvolvimento)
13. [Roadmap — O que falta implementar](#13-roadmap--o-que-falta-implementar)
14. [Guia de Instalação](#14-guia-de-instalação)
15. [Estrutura de Pastas](#15-estrutura-de-pastas)
16. [Glossário](#16-glossário)

---

## 1. Visão Geral do Projeto

O **Jurivox** é uma plataforma SaaS (Software as a Service) projetada para a gestão completa de escritórios de advocacia brasileiros. O sistema opera sob o modelo **multi-tenant**, onde múltiplos escritórios compartilham a mesma infraestrutura, porém cada um acessa exclusivamente seus próprios dados, garantidos por isolamento em nível de banco de dados (Row Level Security).

O projeto nasceu da necessidade de oferecer uma solução moderna, acessível e integrada que substitua planilhas, agendas físicas e sistemas legados fragmentados utilizados pela maioria dos escritórios de pequeno e médio porte no Brasil.

### Objetivos do Produto

- Centralizar a gestão de processos, clientes, prazos, financeiro e documentos em uma única plataforma web.
- Automatizar tarefas repetitivas como cálculo de prazos processuais em dias úteis, notificações de vencimento e monitoramento de movimentações via DataJud/CNJ.
- Oferecer um assistente jurídico com inteligência artificial para análise de processos e consultas legais.
- Permitir a operação segura com autenticação robusta, controle de permissões por cargo e criptografia de dados sensíveis.
- Funcionar como Progressive Web App (PWA) com suporte a notificações push.

### Métricas do Repositório

| Métrica | Valor |
|---------|-------|
| Total de arquivos TypeScript/TSX | 214 |
| Total de linhas de código | ~27.000 |
| Commits no repositório | 37 |
| Páginas (rotas) | 59 |
| Componentes React | 50 |
| Rotas de API | 29 |
| Server Actions | 22 |
| Schemas SQL versionados | 19 |
| Tabelas no banco de dados | 38 |
| Testes (unitários + E2E) | 17 |

---

## 2. Stack Tecnológica

### Core

| Tecnologia | Versão | Função |
|------------|--------|--------|
| **Next.js** | 16.1.6 | Framework fullstack (App Router, SSR, Server Actions) |
| **React** | 19.2.3 | Biblioteca de UI com Server Components |
| **TypeScript** | 5.x | Tipagem estática em todo o projeto |
| **Tailwind CSS** | 4.x | Estilização utilitária |
| **shadcn/ui** | 4.0.8 | Componentes visuais (Button, Card, Input, Dialog, etc.) |

### Backend & Dados

| Tecnologia | Função |
|------------|--------|
| **Supabase** (PostgreSQL) | Banco de dados relacional com RLS, Storage para arquivos |
| **Clerk** | Autenticação (e-mail/senha, OAuth, 2FA), gerenciamento de sessões |
| **Stripe** | Billing, assinaturas e checkout de planos |
| **Mercado Pago** | Gateway de pagamento alternativo (mercado brasileiro) |
| **Zod** | Validação de schemas de dados em runtime |

### Inteligência Artificial

| Tecnologia | Função |
|------------|--------|
| **DeepSeek R1** (deepseek-reasoner) | Modelo de IA para assistente jurídico |
| **Vercel AI SDK** | Streaming de respostas da IA em tempo real |
| **OpenAI-compatible API** | Interface de comunicação com o modelo |

### Integrações & Serviços

| Serviço | Função |
|---------|--------|
| **Resend** | Envio de e-mails transacionais (prazos, movimentações) |
| **Z-API** | Integração com WhatsApp para notificações |
| **DataJud/CNJ** | Monitoramento automático de movimentações processuais |
| **ICP-Brasil** | Assinatura digital com certificado digital |
| **Web Push** | Notificações push no navegador |

### Qualidade & DevOps

| Ferramenta | Função |
|------------|--------|
| **Vitest** | Testes unitários |
| **Playwright** | Testes E2E (end-to-end) |
| **ESLint** | Linting de código |
| **Vercel** | Hosting, deploy automático, cron jobs |

### Bibliotecas Auxiliares

| Biblioteca | Função |
|------------|--------|
| **jsPDF + jsPDF-AutoTable** | Geração de relatórios em PDF |
| **PapaParse** | Parsing de CSV para importação |
| **SheetJS (xlsx)** | Exportação para Excel |
| **Recharts** | Gráficos e visualizações no dashboard |
| **Lucide React** | Ícones |
| **Sonner** | Notificações toast na UI |
| **next-themes** | Tema claro/escuro |

---

## 3. Arquitetura do Sistema

### Padrão Arquitetural

O Jurivox utiliza uma arquitetura **monolítica modular** baseada no Next.js App Router, onde frontend e backend coexistem no mesmo projeto, porém com separação clara de responsabilidades.

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTE (Browser)                    │
│  React 19 + Tailwind + shadcn/ui + PWA Service Worker       │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS
┌──────────────────────────▼──────────────────────────────────┐
│                     MIDDLEWARE (Clerk)                       │
│          Verificação de autenticação em toda rota            │
└──────────────────────────┬──────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
   ┌─────────────┐  ┌───────────┐  ┌──────────────┐
   │   Server     │  │   API      │  │   Server     │
   │  Components  │  │  Routes    │  │  Actions     │
   │  (páginas)   │  │  (/api/*)  │  │  (lib/actions)|
   └──────┬──────┘  └─────┬─────┘  └──────┬───────┘
          │               │               │
          └───────────────┼───────────────┘
                          ▼
              ┌──────────────────────┐
              │   getAuthContext()   │
              │ Clerk userId → DB    │
              └──────────┬───────────┘
                         ▼
              ┌──────────────────────┐
              │   Supabase Admin     │
              │   (Service Role Key) │
              │   + filtro manual    │
              │   por escritorio_id  │
              └──────────┬───────────┘
                         ▼
              ┌──────────────────────┐
              │   PostgreSQL + RLS   │
              │   (Row Level         │
              │    Security)         │
              └──────────────────────┘
```

### Multi-Tenancy

O isolamento de dados entre escritórios é garantido em 4 camadas:

1. **Middleware** — bloqueia rotas privadas para usuários não autenticados.
2. **getAuthContext()** — identifica o `escritorio_id` do usuário logado via Clerk → Supabase.
3. **Filtro manual** — toda query inclui `WHERE escritorio_id = ?`.
4. **Row Level Security (RLS)** — barreira final no PostgreSQL, impedindo acesso cruzado mesmo em caso de falha nas camadas superiores.

### Fluxo de Requisição

```
Navegador → middleware.ts (auth check)
         → layout.tsx (shell: sidebar + header — instantâneo)
         → loading.tsx (spinner enquanto carrega)
         → page.tsx (Server Component: getAuthContext → query → HTML)
```

### Fluxo de Escrita (Server Actions)

```
Formulário (submit) → Server Action ('use server')
                    → getAuthContext()
                    → Validação Zod
                    → INSERT/UPDATE no Supabase
                    → revalidatePath() — atualiza a UI automaticamente
```

---

## 4. Módulos Implementados

### 4.1 — Gestão de Processos

**Status: Implementado**

Módulo central do sistema. Permite o cadastro completo de processos jurídicos com suporte a múltiplas áreas do direito.

- CRUD completo de processos (criar, listar, visualizar, editar, excluir).
- Campos específicos por área jurídica: Civil, Criminal (delegacia, inquérito), Trabalhista (reclamado), Previdenciário (número de benefício), Tributário.
- Número CNJ formatado e indexado para busca rápida.
- Timeline de movimentações (andamento, audiência, sentença, despacho).
- Status do processo: ativo, arquivado, encerrado.
- Vinculação a cliente e responsável (membro do escritório).
- Documentos anexados por processo.
- Visualização em lista e **Kanban** (por status).
- Indicadores de processos sem movimentação recente.
- Análise do processo via IA (DeepSeek R1).

**Rotas:** `/processos`, `/processos/novo`, `/processos/[id]`, `/processos/[id]/editar`, `/processos/kanban`

**Server Actions:** `lib/actions/processos.ts` (263 linhas)

---

### 4.2 — Gestão de Clientes

**Status: Implementado**

- CRUD completo de clientes com dados pessoais (nome, CPF, RG, e-mail, telefone, WhatsApp, endereço).
- Upload de documentos do cliente (RG, CPF, contratos, procurações) via Supabase Storage.
- Filtros e busca na listagem.
- Observações por cliente.
- Vinculação automática com processos.
- Importação em massa via CSV.

**Rotas:** `/clientes`, `/clientes/novo`, `/clientes/[id]`, `/clientes/[id]/editar`

**Server Actions:** `lib/actions/clientes.ts` (193 linhas)

---

### 4.3 — Controle de Prazos

**Status: Implementado**

- CRUD de prazos processuais vinculados a processos.
- Cálculo automático de data de vencimento em **dias úteis** (exclui sábados, domingos e feriados).
- Tabela de feriados nacionais e estaduais configurável.
- Agrupamento visual por urgência: vencidos (vermelho), vence hoje (amarelo), próximos 7 dias (laranja), futuros (verde), concluídos (cinza).
- Marcar prazo como concluído com timestamp.
- Notificação automática de prazos próximos via cron job (`/api/notificacoes/prazos` — diário às 7h).

**Rotas:** `/prazos`, `/prazos/novo`, `/prazos/[id]`

**Server Actions:** `lib/actions/prazos.ts` (176 linhas)

---

### 4.4 — Módulo Financeiro

**Status: Implementado**

- Gestão de honorários por processo (êxito, pro labore, parcelado).
- Registro de pagamentos recebidos com forma de pagamento (PIX, boleto, TED, dinheiro, cartão, cheque).
- Movimentações financeiras gerais (entradas e saídas: aluguel, custas, salários).
- Contas a receber com status (aberto, recebido, vencido, cancelado).
- Relatórios financeiros exportáveis em PDF.
- Importação de extratos OFX (conciliação bancária).
- Geração de boletos (integração Mercado Pago).
- QR Code PIX para pagamentos.
- Cron job para atualização de status de contas a receber (`/api/cron/contas-receber` — dias úteis às 8h).

**Rotas:** `/financeiro`, `/financeiro/relatorio`, `/financeiro/boletos`, `/financeiro/boletos/[id]/pix`, `/financeiro/importar-ofx`, `/contas-receber`, `/vencimentos`

**Server Actions:** `lib/actions/financeiro.ts`, `lib/actions/boletos.ts`, `lib/actions/contas_receber.ts`, `lib/actions/ofx.ts`

---

### 4.5 — Agenda

**Status: Implementado**

- Eventos de agenda: audiências, prazos, providências, reuniões.
- Vinculação a processo e responsável.
- Suporte a eventos de dia inteiro.
- Edição e conclusão de eventos.

**Rotas:** `/agenda`, `/agenda/[id]/editar`

**Server Actions:** `lib/actions/agenda.ts` (170 linhas)

---

### 4.6 — Contratos

**Status: Implementado**

- CRUD de contratos com tipos: fixo, por hora, êxito, misto.
- Valores configuráveis (fixo, hora, percentual de êxito).
- Status: ativo, suspenso, encerrado.
- Vinculação a cliente, processo e responsável.
- Datas de início e fim.

**Rotas:** `/contratos`, `/contratos/novo`, `/contratos/[id]`, `/contratos/[id]/editar`

**Server Actions:** `lib/actions/contratos.ts` (124 linhas)

---

### 4.7 — Timesheet (Horas Trabalhadas)

**Status: Implementado**

- Registro de horas trabalhadas por membro do escritório.
- Vinculação a contrato e/ou processo.
- Tipos: produtivo e não-produtivo.
- Usado para faturamento em contratos por hora.

**Rotas:** `/timesheet`

**Server Actions:** `lib/actions/timesheet.ts` (94 linhas)

---

### 4.8 — Templates de Documentos

**Status: Implementado**

- CRUD de templates de documentos jurídicos (petições, contratos, notificações).
- Editor de conteúdo com variáveis de substituição.
- Geração de documentos a partir de templates preenchendo dados do processo/cliente.
- Limite de templates por plano de assinatura.

**Rotas:** `/templates`, `/templates/novo`, `/templates/[id]`, `/templates/[id]/editar`

**Server Actions:** `lib/actions/templates.ts` (172 linhas)

---

### 4.9 — Assinaturas Digitais

**Status: Implementado**

- Criação de documentos para assinatura.
- Fluxo público de assinatura via link hash (sem necessidade de login).
- Visualização, assinatura e recusa de documentos.
- Integração com ICP-Brasil para certificados digitais.

**Rotas:** `/assinaturas`, `/assinaturas/nova`, `/assinaturas/icp-brasil`, `/assinar/[hash]` (público)

**APIs:** `/api/assinaturas/public/[hash]/visualizar`, `/api/assinaturas/public/[hash]/assinar`, `/api/assinaturas/public/[hash]/recusar`, `/api/icp/certificado`

---

### 4.10 — Assistente de IA Jurídica

**Status: Implementado**

- Chat em tempo real com streaming (resposta palavra por palavra).
- Modelo: DeepSeek R1 (deepseek-reasoner).
- Persona: Desembargador Brasileiro Sênior, com linguagem formal e técnica baseada no CPC/2015.
- Análise automática de processos: o sistema envia as movimentações do processo para a IA analisar.
- Identificação de contradições, citação de artigos de lei, análise de jurisprudência.

**Rota:** `/ia`

**API:** `/api/chat`

---

### 4.11 — Monitoramento DataJud/CNJ

**Status: Implementado**

- Sincronização automática de movimentações processuais via API pública do DataJud.
- Mapeamento de todos os tribunais brasileiros (TJ, TRT, TRF).
- Retry com backoff exponencial para resiliência.
- Extração automática de prazos a partir da descrição das movimentações.
- Cron job para execução automática (dias úteis às 6h).

**Rota:** `/monitoramento`

**APIs:** `/api/monitoramento`, `/api/monitoramento/sync`, `/api/cron/monitoramento`

---

### 4.12 — Gestão de Equipe

**Status: Implementado**

- Convite de novos membros ao escritório via e-mail.
- Cargos: Sócio, Admin, Advogado, Estagiário.
- Sistema de permissões granular por módulo (quem pode ver vs. editar).
- Relatório de equipe.
- Aceitação de convite via link (`/convite/[token]`).

**Rotas:** `/equipe`, `/equipe/relatorio`

**Server Actions:** `lib/actions/equipe.ts` (271 linhas)

---

### 4.13 — Busca Global

**Status: Implementado**

- Busca full-text (FTS) no PostgreSQL.
- Pesquisa simultânea em processos, clientes, prazos e movimentações.

**Rota:** `/busca`

---

### 4.14 — Dashboard & Analytics

**Status: Implementado**

- Painel inicial com estatísticas: total de processos, clientes, prazos vencendo, receita.
- Gráficos interativos com Recharts (processos por área, receita mensal, distribuição de status).
- Indicadores de processos sem movimentação recente.
- Página de analytics avançada.

**Rotas:** `/dashboard`, `/analytics`

---

### 4.15 — Planos e Billing

**Status: Implementado**

- Integração com Stripe para checkout de assinaturas.
- Portal do cliente Stripe para gerenciar assinatura.
- Webhook para sincronização de status do pagamento.
- Trial gratuito de 14 dias com cron de expiração.
- Limites por plano (processos, clientes, membros, templates).
- Verificação dupla: aplicação + trigger PostgreSQL.
- Página de planos com comparativo de funcionalidades.

**Rotas:** `/planos`

**APIs:** `/api/stripe/checkout`, `/api/stripe/portal`, `/api/stripe/webhook`, `/api/stripe/setup`, `/api/cron/trial-expiry`

---

### 4.16 — Configurações e Segurança

**Status: Implementado**

- Configurações do escritório (dados cadastrais).
- Gestão de integrações (DataJud, Resend, Z-API).
- Chaves de API para integração externa (`/api/v1/*`).
- Backup e restauração de dados (exportação/importação JSON).
- Audit log (registro de todas as ações do sistema).
- Gestão de sessões e dispositivos.
- Suporte a 2FA (Two-Factor Authentication via Clerk).
- Criptografia de dados sensíveis no banco (AES-256).
- Importação de dados via CSV.
- Exportação para CSV, Excel (XLSX) e PDF.

**Rotas:** `/configuracoes`, `/configuracoes/api`, `/configuracoes/integracoes`, `/configuracoes/restaurar`, `/seguranca`

---

### 4.17 — Portal do Cliente

**Status: Implementado**

- Área pública para clientes do escritório acessarem informações de seus processos.
- Acesso via token exclusivo (sem necessidade de conta no sistema).

**Rota:** `/cliente/[token]`

---

### 4.18 — Landing Page e Páginas Institucionais

**Status: Implementado**

- Landing page com seções: Hero, Estatísticas, Funcionalidades, Depoimentos, CTA, FAQ.
- Splash screen animada.
- Página de Termos de Uso.
- Página de Política de Privacidade.
- Página de DPA (Data Processing Agreement).
- Onboarding de primeiro acesso (criar escritório).
- Tela de boas-vindas pós-cadastro.

**Rotas:** `/`, `/termos-de-uso`, `/privacidade`, `/dpa`, `/onboarding`, `/bem-vindo`

---

### 4.19 — PWA (Progressive Web App)

**Status: Implementado**

- Manifesto web para instalação como app nativo.
- Service Worker para cache offline.
- Ícones para iOS e Android.
- Push notifications via Web Push API.

**Arquivos:** `public/manifest.json`, `public/site.webmanifest`, `public/sw.js`

---

### 4.20 — API Pública v1

**Status: Implementado**

- Endpoints REST para acesso externo via API keys.
- Endpoints disponíveis: clientes, processos, prazos.
- Autenticação via chave de API gerada no painel de configurações.

**APIs:** `/api/v1/clientes`, `/api/v1/processos`, `/api/v1/prazos`

---

## 5. Modelo de Dados

### Diagrama de Entidades (38 tabelas)

```
escritorios ─────────────┬──────────────────┬─────────────────┐
     │                   │                  │                 │
     ▼                   ▼                  ▼                 ▼
membros_escritorio    clientes         processos          contratos
     │                   │              │    │               │
     │                   ▼              │    ▼               ▼
     │           documentos_cliente     │  movimentacoes   timesheet_lancamentos
     │                                  │
     ▼                                  ├──► prazos
agenda_eventos                          ├──► honorarios ──► pagamentos_honorarios
                                        ├──► documentos_processo
                                        └──► contas_receber

movimentacoes_financeiras (independente, vinculado ao escritório)
```

### Tabelas Principais

| Tabela | Descrição | Schema |
|--------|-----------|--------|
| `escritorios` | Tenant (escritório de advocacia) | v1 |
| `membros_escritorio` | Usuários vinculados ao escritório | v1 |
| `clientes` | Cadastro de clientes | v1 |
| `processos` | Processos jurídicos (core) | v1 |
| `movimentacoes` | Timeline de andamentos do processo | v1 |
| `prazos` | Prazos processuais com cálculo de dias úteis | v1 |
| `documentos_cliente` | Arquivos upload (Supabase Storage) | v1 |
| `honorarios` | Contratos de honorários | v2 |
| `pagamentos_honorarios` | Pagamentos recebidos | v2 |
| `movimentacoes_financeiras` | Entradas/saídas do caixa | v2 |
| `contratos` | Relação comercial escritório-cliente | v3 |
| `timesheet_lancamentos` | Registro de horas trabalhadas | v3 |
| `agenda_eventos` | Eventos de agenda | v3 |
| `contas_receber` | Faturas e cobranças | v3 |
| `documentos_processo` | Documentos vinculados a processos | v4 |
| `rate_limit_log` | Log de rate limiting | v5 |
| `templates_documentos` | Templates de documentos jurídicos | v6 |
| `assinaturas_planos` | Planos de assinatura | v6 |
| `assinaturas_escritorio` | Assinatura ativa do escritório | v6 |
| `feriados` | Feriados para cálculo de prazos | v9 |
| `boletos` | Boletos emitidos | v10 |
| `portal_cliente_tokens` | Tokens de acesso do portal do cliente | v10 |
| `icp_certificados` | Certificados digitais ICP-Brasil | v11 |
| `push_subscriptions` | Assinaturas de push notification | v15 |
| `api_keys` | Chaves de API pública | v16 |
| `sqa_*` (múltiplas tabelas) | Tabelas do plano SQA/qualidade | v17 |
| `audit_logs` | Logs de auditoria | v8 |
| `campos_criptografados` | Dados sensíveis criptografados | v19 |

### Versionamento de Schema

O banco utiliza migrações SQL versionadas (v1 a v19), executadas sequencialmente no Supabase SQL Editor. Cada versão adiciona tabelas e funcionalidades sem quebrar o schema anterior.

---

## 6. Levantamento de Requisitos Funcionais

### RF01 — Autenticação e Autorização

| ID | Requisito | Status |
|----|-----------|--------|
| RF01.1 | O sistema deve permitir login via e-mail/senha | Feito |
| RF01.2 | O sistema deve suportar login via OAuth (Google, GitHub) | Feito (Clerk) |
| RF01.3 | O sistema deve suportar autenticação de dois fatores (2FA) | Feito |
| RF01.4 | O sistema deve redirecionar novos usuários para o onboarding | Feito |
| RF01.5 | O sistema deve implementar controle de permissões por cargo (sócio, admin, advogado, estagiário) | Feito |
| RF01.6 | O sistema deve permitir gerenciar sessões ativas e dispositivos | Feito |

### RF02 — Gestão de Escritório (Multi-Tenant)

| ID | Requisito | Status |
|----|-----------|--------|
| RF02.1 | O sistema deve permitir a criação de um escritório no primeiro acesso | Feito |
| RF02.2 | O sistema deve garantir isolamento total de dados entre escritórios | Feito (RLS) |
| RF02.3 | O sistema deve permitir convidar membros via e-mail | Feito |
| RF02.4 | O sistema deve permitir definir e alterar cargos dos membros | Feito |
| RF02.5 | O sistema deve editar os dados cadastrais do escritório (nome, CNPJ, e-mail, telefone) | Feito |

### RF03 — Gestão de Clientes

| ID | Requisito | Status |
|----|-----------|--------|
| RF03.1 | O sistema deve permitir cadastrar clientes com dados pessoais completos | Feito |
| RF03.2 | O sistema deve permitir editar e excluir clientes | Feito |
| RF03.3 | O sistema deve permitir upload de documentos do cliente | Feito |
| RF03.4 | O sistema deve permitir vincular clientes a processos | Feito |
| RF03.5 | O sistema deve permitir importar clientes via CSV | Feito |
| RF03.6 | O sistema deve permitir busca e filtros na listagem de clientes | Feito |

### RF04 — Gestão de Processos

| ID | Requisito | Status |
|----|-----------|--------|
| RF04.1 | O sistema deve permitir cadastrar processos com número CNJ, tribunal, vara, área jurídica | Feito |
| RF04.2 | O sistema deve exibir campos específicos por área (Criminal: delegacia; Trabalhista: reclamado; etc.) | Feito |
| RF04.3 | O sistema deve permitir registrar movimentações na timeline do processo | Feito |
| RF04.4 | O sistema deve permitir visualizar processos em formato lista e Kanban | Feito |
| RF04.5 | O sistema deve indicar processos sem movimentação recente | Feito |
| RF04.6 | O sistema deve permitir vincular documentos a processos | Feito |
| RF04.7 | O sistema deve permitir análise do processo via IA |  Feito |
| RF04.8 | O sistema deve permitir editar e arquivar processos | Feito |

### RF05 — Controle de Prazos

| ID | Requisito | Status |
|----|-----------|--------|
| RF05.1 | O sistema deve calcular a data de vencimento em dias úteis ou corridos | Feito |
| RF05.2 | O sistema deve considerar feriados no cálculo de dias úteis | Feito |
| RF05.3 | O sistema deve agrupar prazos por urgência (vencido, hoje, 7 dias, futuro, concluído) | Feito |
| RF05.4 | O sistema deve permitir marcar prazos como concluídos | Feito |
| RF05.5 | O sistema deve enviar notificações de prazos próximos do vencimento | Feito |

### RF06 — Módulo Financeiro

| ID | Requisito | Status |
|----|-----------|--------|
| RF06.1 | O sistema deve permitir registrar honorários por processo | Feito |
| RF06.2 | O sistema deve permitir registrar pagamentos recebidos | Feito |
| RF06.3 | O sistema deve registrar movimentações financeiras gerais (entradas/saídas) | Feito |
| RF06.4 | O sistema deve gerenciar contas a receber com status | Feito |
| RF06.5 | O sistema deve gerar relatórios financeiros em PDF | Feito |
| RF06.6 | O sistema deve permitir importação de extratos OFX | Feito |
| RF06.7 | O sistema deve emitir boletos via Mercado Pago | Feito |
| RF06.8 | O sistema deve gerar QR Code PIX para cobranças | Feito |

### RF07 — Agenda

| ID | Requisito | Status |
|----|-----------|--------|
| RF07.1 | O sistema deve permitir criar eventos (audiências, reuniões, prazos, providências) | Feito |
| RF07.2 | O sistema deve permitir vincular eventos a processos e responsáveis | Feito |
| RF07.3 | O sistema deve suportar eventos de dia inteiro | Feito |

### RF08 — Contratos e Timesheet

| ID | Requisito | Status |
|----|-----------|--------|
| RF08.1 | O sistema deve permitir criar contratos com diferentes tipos de cobrança | Feito |
| RF08.2 | O sistema deve permitir registrar horas trabalhadas por membro | Feito |
| RF08.3 | O sistema deve vincular lançamentos de timesheet a contratos e processos | Feito |

### RF09 — Templates de Documentos

| ID | Requisito | Status |
|----|-----------|--------|
| RF09.1 | O sistema deve permitir criar templates com variáveis de substituição | Feito |
| RF09.2 | O sistema deve gerar documentos preenchidos a partir de templates | Feito |
| RF09.3 | O sistema deve limitar quantidade de templates por plano | Feito |

### RF10 — Assinaturas Digitais

| ID | Requisito | Status |
|----|-----------|--------|
| RF10.1 | O sistema deve permitir enviar documentos para assinatura via link | Feito |
| RF10.2 | O signatário deve poder assinar ou recusar sem ter conta no sistema | Feito |
| RF10.3 | O sistema deve suportar certificados ICP-Brasil | Feito |

### RF11 — Assistente de IA

| ID | Requisito | Status |
|----|-----------|--------|
| RF11.1 | O sistema deve oferecer chat com IA jurídica em tempo real | Feito |
| RF11.2 | A IA deve analisar processos automaticamente ao receber movimentações | Feito |
| RF11.3 | A IA deve usar linguagem formal e técnica baseada no CPC/2015 | Feito |

### RF12 — Monitoramento DataJud

| ID | Requisito | Status |
|----|-----------|--------|
| RF12.1 | O sistema deve buscar movimentações automaticamente na API DataJud/CNJ | Feito |
| RF12.2 | O sistema deve mapear todos os tribunais brasileiros | Feito |
| RF12.3 | O sistema deve criar prazos automaticamente a partir das movimentações | Feito |

### RF13 — Notificações

| ID | Requisito | Status |
|----|-----------|--------|
| RF13.1 | O sistema deve enviar e-mails de notificação via Resend | Feito |
| RF13.2 | O sistema deve enviar notificações via WhatsApp (Z-API) | Código pronto, aguardando credenciais |
| RF13.3 | O sistema deve suportar push notifications no navegador | Feito |
| RF13.4 | O sistema deve exibir badge de notificações não lidas | Feito |

### RF14 — Billing e Planos

| ID | Requisito | Status |
|----|-----------|--------|
| RF14.1 | O sistema deve oferecer trial gratuito de 14 dias | Feito |
| RF14.2 | O sistema deve integrar com Stripe para checkout |  Feito |
| RF14.3 | O sistema deve aplicar limites por plano (processos, clientes, membros, templates) | Feito |
| RF14.4 | O sistema deve oferecer portal de gerenciamento da assinatura | Feito |

### RF15 — Exportação e Importação

| ID | Requisito | Status |
|----|-----------|--------|
| RF15.1 | O sistema deve exportar dados em CSV | Feito |
| RF15.2 | O sistema deve exportar dados em Excel (XLSX) | Feito |
| RF15.3 | O sistema deve exportar relatórios em PDF | Feito |
| RF15.4 | O sistema deve importar dados via CSV | Feito |
| RF15.5 | O sistema deve permitir backup e restauração completa em JSON | Feito |

---

## 7. Requisitos Não-Funcionais

### RNF01 — Performance

| ID | Requisito | Meta |
|----|-----------|------|
| RNF01.1 | Tempo de carregamento inicial (LCP) | < 2.5s |
| RNF01.2 | Tempo de resposta de Server Actions | < 500ms |
| RNF01.3 | Disponibilidade do sistema | ≥ 99.5% |
| RNF01.4 | MTBF (Mean Time Between Failures) | ≥ 200h |

### RNF02 — Segurança

| ID | Requisito | Status |
|----|-----------|--------|
| RNF02.1 | Autenticação via Clerk com suporte a 2FA | ✅ |
| RNF02.2 | Row Level Security (RLS) em todas as tabelas | ✅ |
| RNF02.3 | Service Role Key exclusiva do servidor (nunca exposta ao cliente) | ✅ |
| RNF02.4 | Headers de segurança: HSTS, CSP, X-Frame-Options, X-XSS-Protection | ✅ |
| RNF02.5 | Rate limiting por endpoint | ✅ |
| RNF02.6 | Audit log de todas as operações sensíveis | ✅ |
| RNF02.7 | Criptografia de dados sensíveis no banco (AES-256) | ✅ |
| RNF02.8 | Validação de input com Zod em todas as Server Actions | ✅ |

### RNF03 — Usabilidade

| ID | Requisito | Status |
|----|-----------|--------|
| RNF03.1 | Interface responsiva (desktop + mobile) | ✅ |
| RNF03.2 | Sidebar colapsável com menu hambúrguer no mobile | ✅ |
| RNF03.3 | Tema claro/escuro | ✅ |
| RNF03.4 | Splash screen animada | ✅ |
| RNF03.5 | Loading states com spinners em todas as páginas | ✅ |
| RNF03.6 | Feedbacks via toast (Sonner) para todas as ações | ✅ |

### RNF04 — Escalabilidade

| ID | Requisito |
|----|-----------|
| RNF04.1 | Arquitetura multi-tenant com isolamento por escritório |
| RNF04.2 | Limites por plano para controle de crescimento |
| RNF04.3 | Índices otimizados no banco para consultas frequentes |
| RNF04.4 | Busca full-text (FTS) no PostgreSQL |

### RNF05 — Conformidade Legal

| ID | Requisito | Status |
|----|-----------|--------|
| RNF05.1 | Conformidade com a LGPD | ✅ (Política de Privacidade, DPA, direito ao esquecimento) |
| RNF05.2 | Termos de Uso disponíveis | ✅ |
| RNF05.3 | Plano SQA conforme IEEE 730 e ISO 9001:2015 | ✅ |

### RNF06 — Observabilidade

| ID | Requisito | Status |
|----|-----------|--------|
| RNF06.1 | Captura de erros client-side com logs estruturados | ✅ |
| RNF06.2 | Endpoint de health check (`/api/health`) | ✅ |
| RNF06.3 | Relatórios de erros via API (`/api/observabilidade/erros`) | ✅ |

---

## 8. APIs e Integrações

### APIs Internas (29 rotas)

| Rota | Método | Descrição |
|------|--------|-----------|
| `/api/chat` | POST | Chat com IA (streaming) |
| `/api/health` | GET | Health check do sistema |
| `/api/processos` | GET | Listar processos |
| `/api/processos/[id]/movimentacoes` | GET | Movimentações de um processo |
| `/api/backup` | GET | Exportar backup completo |
| `/api/backup/importar` | POST | Importar backup |
| `/api/financeiro/relatorio` | GET | Relatório financeiro PDF |
| `/api/monitoramento` | GET | Status do monitoramento DataJud |
| `/api/monitoramento/sync` | POST | Sincronizar movimentações DataJud |
| `/api/notificacoes/badges` | GET | Contagem de notificações |
| `/api/notificacoes/prazos` | POST | Notificar prazos (cron) |
| `/api/stripe/checkout` | POST | Criar sessão de checkout |
| `/api/stripe/portal` | POST | Abrir portal do cliente |
| `/api/stripe/webhook` | POST | Webhook do Stripe |
| `/api/push/subscribe` | POST | Inscrever push notification |
| `/api/push/send` | POST | Enviar push notification |
| `/api/icp/certificado` | POST | Upload de certificado ICP-Brasil |
| `/api/observabilidade/erros` | POST | Log de erros do cliente |
| `/api/admin/sqa` | GET/POST | Administração SQA |
| `/api/cron/monitoramento` | GET | Cron: monitoramento DataJud |
| `/api/cron/contas-receber` | GET | Cron: atualizar contas a receber |
| `/api/cron/trial-expiry` | GET | Cron: expirar trials |

### API Pública v1 (autenticada por API Key)

| Rota | Método | Descrição |
|------|--------|-----------|
| `/api/v1/clientes` | GET | Listar clientes do escritório |
| `/api/v1/processos` | GET | Listar processos do escritório |
| `/api/v1/prazos` | GET | Listar prazos do escritório |

### Cron Jobs (Vercel)

| Rota | Schedule | Descrição |
|------|----------|-----------|
| `/api/cron/monitoramento` | 06:00 (seg-sex) | Sincronizar DataJud |
| `/api/notificacoes/prazos` | 07:00 (diário) | Notificar prazos próximos |
| `/api/cron/contas-receber` | 08:00 (seg-sex) | Atualizar status financeiro |
| `/api/cron/trial-expiry` | 09:00 (diário) | Verificar trials expirados |

---

## 9. Segurança e Conformidade

### Camadas de Proteção

```
Camada 1 — Middleware Clerk     → bloqueia acesso não autenticado
Camada 2 — getAuthContext()     → identifica escritório do usuário
Camada 3 — Filtro manual        → WHERE escritorio_id = ? em toda query
Camada 4 — RLS (PostgreSQL)     → barreira final no banco de dados
Camada 5 — Rate Limiting        → previne abuso de API
Camada 6 — Audit Log            → registro imutável de ações
Camada 7 — Criptografia (AES)   → dados sensíveis criptografados em repouso
```

### Headers de Segurança (vercel.json)

- `Strict-Transport-Security` (HSTS com preload)
- `Content-Security-Policy` (CSP restritivo)
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `X-Permitted-Cross-Domain-Policies: none`

### Conformidade

- **LGPD** — Política de Privacidade, Termos de Uso, DPA, direito ao esquecimento.
- **IEEE 730** — Plano de SQA documentado (SQA_PLAN.md).
- **ISO 9001:2015** — Estrutura de qualidade com gestão de riscos e conhecimento organizacional.
- **OWASP Top 10** — Proteções contra XSS, CSRF, SQL Injection, etc.

---

## 10. Testes e Qualidade

### Testes Unitários (Vitest)

| Arquivo | Escopo |
|---------|--------|
| `tests/health.test.ts` | Health check da API |
| `tests/limites.test.ts` | Verificação de limites por plano |
| `tests/permissoes.test.ts` | Sistema de permissões por cargo |
| `tests/prazos.test.ts` | Cálculo de prazos em dias úteis |
| `tests/sqa.test.ts` | Funções do plano SQA |
| `tests/templates.test.ts` | CRUD de templates |
| `tests/validacoes.test.ts` | Validações Zod |

### Testes E2E (Playwright)

| Arquivo | Escopo |
|---------|--------|
| `tests/e2e/auth.spec.ts` | Fluxo de autenticação |
| `tests/e2e/dashboard.spec.ts` | Dashboard e navegação |
| `tests/e2e/clientes.spec.ts` | CRUD de clientes |
| `tests/e2e/processos.spec.ts` | CRUD de processos |
| `tests/e2e/prazos.spec.ts` | Gestão de prazos |
| `tests/e2e/templates.spec.ts` | Templates de documentos |
| `tests/e2e/api.spec.ts` | APIs internas |
| `tests/e2e/api-v1.spec.ts` | API pública v1 |
| `tests/e2e/landing.spec.ts` | Landing page |
| `tests/e2e/public-smoke.spec.ts` | Smoke test de rotas públicas |

### Comandos

```bash
npm run test          # Testes unitários (Vitest)
npm run test:watch    # Testes em modo watch
npm run test:e2e      # Testes E2E (Playwright)
npm run lint          # ESLint
```

---

## 11. Infraestrutura e Deploy

### Ambiente de Produção

| Componente | Serviço |
|------------|---------|
| Hosting & CDN | Vercel |
| Banco de dados | Supabase (PostgreSQL) |
| Storage de arquivos | Supabase Storage |
| Autenticação | Clerk |
| Pagamentos | Stripe + Mercado Pago |
| E-mail | Resend |
| DNS | Domínio: jurivox.com.br |

### Variáveis de Ambiente Necessárias

```
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY

# Supabase
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

# Stripe
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

# IA
DEEPSEEK_API_KEY

# E-mail
RESEND_API_KEY
RESEND_FROM_EMAIL

# DataJud
DATAJUD_API_KEY
DATAJUD_API_URL

# WhatsApp (opcional)
ZAPI_INSTANCE_ID
ZAPI_TOKEN
ZAPI_CLIENT_TOKEN

# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN

# Criptografia
ENCRYPTION_KEY

# Observabilidade
NEXT_PUBLIC_ENABLE_CLIENT_ERROR_REPORTING

# Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY
```

---

## 12. Status Atual do Desenvolvimento

### Resumo Geral

| Categoria | Quantidade | Status |
|-----------|------------|--------|
| Módulos implementados | 20 | ✅ |
| Páginas funcionais | 59 | ✅ |
| Server Actions | 22 | ✅ |
| APIs (internas + públicas) | 29 | ✅ |
| Schemas SQL | 19 versões | ✅ |
| Tabelas no banco | 38 | ✅ |
| Testes escritos | 17 | ✅ |
| Documentação | ARQUITETURA.md, SQA_PLAN.md, INSTALACAO.md | ✅ |
| PWA com push notifications | Manifesto + SW | ✅ |
| Landing page | Completa com animações | ✅ |
| Cron jobs configurados | 4 | ✅ |

### Percentual Estimado de Conclusão

| Área | % |
|------|---|
| Backend (APIs, Actions, banco) | ~90% |
| Frontend (páginas, componentes) | ~85% |
| Integrações (Stripe, Clerk, Supabase, IA) | ~90% |
| Segurança (RLS, CSP, 2FA, criptografia) | ~90% |
| Testes | ~60% |
| Documentação | ~80% |
| **Média geral** | **~85%** |

---

## 13. Roadmap — O que falta implementar

| Item | Prioridade | Complexidade | Estimativa |
|------|------------|--------------|------------|
| Ativar WhatsApp (configurar credenciais Z-API) | Alta | Baixa | 1–2h |
| Aumentar cobertura de testes (meta: 70%+) | Alta | Média | 1 semana |
| Gerador automático de petições via IA | Média | Alta | 2+ semanas |
| Calendário visual interativo (arrastar eventos) | Média | Média | 3–5 dias |
| Relatórios avançados com filtros customizáveis | Média | Média | 1 semana |
| Integração com tribunais eletrônicos (PJe, e-SAJ) | Baixa | Muito Alta | 2–4 semanas |
| App mobile nativo (React Native) | Baixa | Muito Alta | 1–2 meses |
| Multi-idioma (i18n) | Baixa | Média | 1 semana |
| Modo offline completo (PWA avançado) | Baixa | Alta | 2 semanas |
| Dashboard customizável (widgets drag-and-drop) | Baixa | Alta | 2 semanas |

---

## 14. Guia de Instalação

### Pré-requisitos

- Node.js 20+
- npm ou pnpm
- Conta no Supabase
- Aplicação no Clerk
- Conta no Stripe (para billing)

### Passos

```bash
# 1. Clonar o repositório
git clone https://github.com/Gabriel07-gif/Jurivox.git
cd Jurivox

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
cp .env.local.example .env.local
# Editar .env.local com suas chaves

# 4. Executar schemas no Supabase (SQL Editor, na ordem)
# database/schema.sql
# database/schema_v2_financeiro.sql
# database/schema_v3_novos_modulos.sql
# ... (até schema_v19)

# 5. Rodar em desenvolvimento
npm run dev

# 6. Acessar
# http://localhost:3000
```

### Verificações

```bash
npm run lint        # Linting
npm run build       # Build de produção
npm run test        # Testes unitários
npm run test:e2e    # Testes E2E
```

---

## 15. Estrutura de Pastas

```
Jurivox/
├── app/                          # Rotas Next.js (App Router)
│   ├── (auth)/                   # Login e cadastro (Clerk)
│   │   ├── sign-in/
│   │   └── sign-up/
│   ├── (dashboard)/              # Área protegida (logado)
│   │   ├── dashboard/            # Tela inicial
│   │   ├── clientes/             # CRUD clientes
│   │   ├── processos/            # CRUD processos + Kanban
│   │   ├── prazos/               # Gestão de prazos
│   │   ├── financeiro/           # Módulo financeiro completo
│   │   ├── contratos/            # CRUD contratos
│   │   ├── agenda/               # Eventos e audiências
│   │   ├── timesheet/            # Horas trabalhadas
│   │   ├── templates/            # Templates de documentos
│   │   ├── assinaturas/          # Assinaturas digitais
│   │   ├── ia/                   # Chat com IA jurídica
│   │   ├── monitoramento/        # DataJud/CNJ
│   │   ├── equipe/               # Gestão de membros
│   │   ├── busca/                # Busca global FTS
│   │   ├── analytics/            # Análises e gráficos
│   │   ├── planos/               # Planos e billing
│   │   ├── configuracoes/        # Configurações do escritório
│   │   ├── seguranca/            # Segurança e 2FA
│   │   ├── contas-receber/       # Faturas e cobranças
│   │   ├── vencimentos/          # Vencimentos financeiros
│   │   ├── documentos/           # Documentos do escritório
│   │   ├── onboarding/           # Primeiro acesso
│   │   └── bem-vindo/            # Pós-cadastro
│   ├── api/                      # APIs server-side
│   │   ├── chat/                 # IA streaming
│   │   ├── stripe/               # Billing (checkout, portal, webhook)
│   │   ├── cron/                 # Jobs agendados
│   │   ├── v1/                   # API pública
│   │   └── ...                   # Demais endpoints
│   ├── assinar/                  # Assinatura pública
│   ├── cliente/                  # Portal do cliente
│   ├── convite/                  # Aceitar convite
│   ├── privacidade/              # Política de privacidade
│   ├── termos-de-uso/            # Termos de uso
│   ├── dpa/                      # Data Processing Agreement
│   └── page.tsx                  # Landing page
│
├── components/                   # Componentes React reutilizáveis
│   ├── ui/                       # shadcn/ui (Button, Card, etc.)
│   ├── sidebar.tsx               # Menu lateral
│   ├── header.tsx                # Cabeçalho
│   ├── clientes/                 # Componentes de clientes
│   ├── processos/                # Componentes de processos
│   ├── financeiro/               # Componentes financeiros
│   ├── templates/                # Componentes de templates
│   └── ...                       # Demais módulos
│
├── lib/                          # Lógica de negócio (server-side)
│   ├── actions/                  # Server Actions (22 arquivos)
│   ├── auth.ts                   # getAuthContext()
│   ├── ai.ts                     # Configuração DeepSeek
│   ├── asaas.ts                  # Integração pagamentos
│   ├── cripto.ts                 # Criptografia AES-256
│   ├── datajud.ts                # Integração DataJud/CNJ
│   ├── limites.ts                # Verificação de limites por plano
│   ├── mercadopago.ts            # Integração Mercado Pago
│   ├── permissoes.ts             # Sistema de permissões
│   ├── rate-limit.ts             # Rate limiting
│   ├── sqa.ts                    # Funções SQA
│   ├── supabase/                 # Clientes Supabase (server, client, admin)
│   ├── stripe/                   # Integração Stripe
│   ├── notificacoes/             # E-mail (Resend) + WhatsApp (Z-API) + Push
│   └── monitoramento/            # Monitoramento de processos
│
├── database/                     # Schemas SQL versionados (v1 a v19)
├── tests/                        # Testes unitários e E2E
├── scripts/                      # Scripts auxiliares
├── public/                       # Assets estáticos + PWA
│
├── middleware.ts                  # Proteção de rotas (Clerk)
├── next.config.ts                # Configuração Next.js
├── vercel.json                   # Cron jobs + headers de segurança
├── ARQUITETURA.md                # Documentação de arquitetura
├── SQA_PLAN.md                   # Plano de qualidade (IEEE 730 / ISO 9001)
├── INSTALACAO.md                 # Guia de instalação
└── README.md                     # README do projeto
```

---

## 16. Glossário

| Termo | Significado |
|-------|-------------|
| **Multi-Tenant** | Arquitetura onde múltiplos clientes (escritórios) compartilham a mesma infraestrutura |
| **RLS** | Row Level Security — recurso do PostgreSQL que filtra dados por usuário no nível do banco |
| **Server Action** | Função do Next.js que roda no servidor, chamada diretamente pelo frontend |
| **Server Component** | Componente React que renderiza no servidor (sem JavaScript no cliente) |
| **SSR** | Server Side Rendering — o HTML é gerado no servidor antes de chegar ao navegador |
| **CNJ** | Conselho Nacional de Justiça — órgão que mantém a numeração única de processos |
| **DataJud** | Base de dados pública do CNJ com movimentações processuais |
| **ICP-Brasil** | Infraestrutura de Chaves Públicas Brasileira — certificação digital |
| **PWA** | Progressive Web App — aplicação web que pode ser instalada como app nativo |
| **FTS** | Full-Text Search — busca textual indexada no PostgreSQL |
| **SQA** | Software Quality Assurance — garantia de qualidade de software |
| **LGPD** | Lei Geral de Proteção de Dados — legislação brasileira de privacidade |

---

> **Documento gerado em maio de 2026.**
> Repositório: [github.com/Gabriel07-gif/Jurivox](https://github.com/Gabriel07-gif/Jurivox)
