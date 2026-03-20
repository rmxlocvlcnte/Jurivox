# JurisFlow — Guia Completo da Arquitetura para Desenvolvedores

> Este documento explica **como o sistema funciona por dentro**, em linguagem acessível.
> Ideal para onboarding de novos desenvolvedores ou apresentações técnicas.

---

## 1. O que é o JurisFlow?

É um **SaaS jurídico multi-tenant** — isso significa que é um sistema onde vários escritórios de advocacia diferentes usam a mesma plataforma, mas cada um vê **apenas os seus próprios dados**. Funciona como um condomínio: todos moram no mesmo prédio (servidor), mas cada apartamento (escritório) é privado.

---

## 2. Tecnologias Utilizadas

| Tecnologia | Para que serve | Analogia simples |
|------------|---------------|-----------------|
| **Next.js 16** | Framework principal — organiza as páginas, rotas e servidor | É a "estrutura do prédio" |
| **React 19** | Biblioteca para construir as telas interativas | São as "paredes e móveis" |
| **TypeScript** | JavaScript com tipagem — evita erros de código | É o "projeto arquitetônico" |
| **Clerk** | Gerencia login, cadastro e sessão dos usuários | É o "porteiro do prédio" |
| **Supabase** | Banco de dados PostgreSQL + armazenamento de arquivos | É o "arquivo morto + cofre" |
| **Tailwind CSS** | Estilização das telas (cores, tamanhos, layout) | É a "pintura e decoração" |
| **shadcn/ui** | Componentes visuais prontos (botões, cards, inputs) | São os "móveis planejados" |
| **DeepSeek R1** | Modelo de IA para o assistente jurídico | É o "consultor especialista" |
| **Resend** | Serviço de envio de e-mails | É o "carteiro digital" |
| **Z-API** | Integração com WhatsApp | É o "ramal do WhatsApp" |
| **Vercel AI SDK** | Conecta o servidor com a IA, com resposta em tempo real | É o "tradutor" entre o app e a IA |

---

## 3. Estrutura de Pastas — O Mapa do Projeto

```
projeto-saas/
│
├── app/                    ← TODAS as páginas do sistema (Next.js App Router)
│   ├── (auth)/             ← Páginas públicas: login e cadastro
│   ├── (dashboard)/        ← Páginas protegidas: só para quem está logado
│   │   ├── dashboard/      ← Tela inicial com estatísticas
│   │   ├── clientes/       ← Gestão de clientes
│   │   ├── processos/      ← Gestão de processos jurídicos
│   │   ├── prazos/         ← Controle de prazos
│   │   ├── financeiro/     ← Módulo financeiro
│   │   ├── ia/             ← Assistente de IA jurídica
│   │   ├── busca/          ← Busca global
│   │   └── onboarding/     ← Tela de primeiro acesso (criar escritório)
│   ├── api/                ← Endpoints do servidor (rotas HTTP)
│   │   ├── chat/           ← Endpoint da IA (streaming)
│   │   └── processos/      ← Endpoint para listar processos
│   ├── layout.tsx          ← Layout raiz: configura Clerk e fonte
│   └── loading.tsx         ← Spinner global de carregamento
│
├── components/             ← Componentes visuais reutilizáveis
│   ├── sidebar.tsx         ← Menu lateral de navegação
│   ├── header.tsx          ← Cabeçalho com busca e perfil
│   ├── upload-documento.tsx← Componente de upload de arquivos
│   └── ui/                 ← Componentes shadcn (Button, Card, etc.)
│
├── lib/                    ← Lógica do servidor (não é visual)
│   ├── auth.ts             ← Função central de autenticação
│   ├── ai.ts               ← Configuração do modelo de IA
│   ├── actions/            ← Server Actions: funções que escrevem no banco
│   │   ├── onboarding.ts   ← Criar escritório
│   │   ├── clientes.ts     ← CRUD de clientes
│   │   ├── processos.ts    ← CRUD de processos
│   │   ├── prazos.ts       ← CRUD de prazos + cálculo
│   │   ├── financeiro.ts   ← Honorários e movimentações
│   │   └── documentos.ts   ← Upload de documentos
│   ├── notificacoes/       ← Envio de alertas
│   │   ├── email.ts        ← Envio via Resend
│   │   └── whatsapp.ts     ← Envio via Z-API
│   └── supabase/           ← Clientes de conexão com o banco
│       ├── server.ts       ← Para Server Components
│       ├── client.ts       ← Para Client Components
│       └── admin.ts        ← Acesso total (ignora RLS)
│
├── database/               ← Scripts SQL do banco de dados
│   ├── schema.sql          ← Tabelas principais
│   └── schema_v2_financeiro.sql ← Tabelas financeiras
│
└── middleware.ts           ← Portão de entrada: verifica login em TODA rota
```

---

## 4. Como Funciona o Fluxo de uma Requisição

Quando um usuário digita `jurisflow.com/clientes` no navegador, isso é o que acontece:

```
Navegador
    ↓
middleware.ts         ← "Você está logado?" Se não → redireciona para /sign-in
    ↓
app/(dashboard)/layout.tsx   ← Renderiza o shell: sidebar + header (instantâneo)
    ↓
app/(dashboard)/loading.tsx  ← Mostra spinner enquanto a página carrega
    ↓
app/(dashboard)/clientes/page.tsx
    → chama getAuthContext()  ← "Quem é esse usuário? Qual escritório?"
    → consulta Supabase       ← Busca os clientes DESSE escritório
    → renderiza a lista       ← Retorna o HTML pronto para o browser
```

**Ponto importante:** as consultas ao banco acontecem no **servidor** (não no navegador do usuário). O usuário recebe o HTML já com os dados. Isso é chamado de **Server Side Rendering (SSR)**.

---

## 5. O Sistema de Autenticação (Clerk + Supabase)

Este é o ponto mais importante e mais complexo do projeto. São dois sistemas de autenticação que precisam se entender:

### O problema
- **Clerk** cuida do login (e-mail, senha, OAuth, 2FA)
- **Supabase** cuida do banco de dados com proteção por usuário (RLS)
- Eles usam sistemas de token diferentes e não se conhecem nativamente

### A solução: Admin Client

```
Usuário faz login no Clerk
         ↓
Clerk gera um userId (ex: "user_2abc...")
         ↓
lib/auth.ts usa esse userId para consultar o Supabase
com uma chave especial (Service Role Key) que bypassa
todas as regras de segurança do banco
         ↓
Retorna: { escritorioId, membroId, cargo, supabase }
         ↓
Cada página usa escritorioId para filtrar os dados
```

**Arquivo:** `lib/supabase/admin.ts`
```typescript
// Esta chave tem acesso total ao banco — nunca exposta no frontend
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Chave secreta do servidor
  )
}
```

**Arquivo:** `lib/auth.ts` — a função mais usada no projeto
```typescript
export async function getAuthContext() {
  const { userId } = await auth() // Pega o ID do Clerk

  const supabase = createAdminClient()

  // Descobre qual escritório esse usuário pertence
  const { data: membro } = await supabase
    .from('membros_escritorio')
    .select('id, escritorio_id, cargo')
    .eq('clerk_user_id', userId)
    .maybeSingle()

  return { userId, escritorioId: membro?.escritorio_id, supabase }
}
```

Todo Server Component e toda Server Action começa com:
```typescript
const { escritorioId, supabase } = await getAuthContext()
if (!escritorioId) redirect('/onboarding')
// ... consultas ao banco sempre com WHERE escritorio_id = escritorioId
```

---

## 6. O Banco de Dados (Multi-Tenant com RLS)

### Estrutura das tabelas

```
escritorios          ← "apartamento" de cada escritório
    ↕
membros_escritorio   ← usuários que pertencem ao escritório
    ↕
clientes             ← clientes do escritório
    ↕
processos            ← processos jurídicos de cada cliente
    ↕
movimentacoes        ← histórico/timeline de cada processo
    ↕
prazos               ← prazos vinculados a processos
    ↕
documentos_cliente   ← arquivos enviados por cliente
    ↕
honorarios           ← contratos de honorários
    ↕
pagamentos_honorarios← pagamentos recebidos
    ↕
movimentacoes_financeiras ← entradas e saídas do caixa
```

### Row Level Security (RLS)

O Supabase tem uma funcionalidade chamada RLS que funciona como um filtro automático no banco. Mesmo que um programador esqueça de colocar o `WHERE escritorio_id = X`, o banco nunca retorna dados de outro escritório.

```sql
-- Esta política diz: "só mostre clientes do escritório do usuário logado"
CREATE POLICY "acesso_proprio_escritorio" ON clientes
  FOR ALL USING (escritorio_id = get_escritorio_id());
```

**Porém:** como usamos Clerk (e não o auth do Supabase), o `get_escritorio_id()` não funciona automaticamente. Por isso usamos o **Admin Client** no servidor — que bypassa o RLS — mas compensamos filtrando manualmente com `escritorioId` em todas as queries.

---

## 7. Server Actions — Como os Dados São Salvos

No Next.js moderno, quando o usuário clica em "Salvar", não se faz uma chamada AJAX tradicional. Usa-se **Server Actions**: funções que rodam no servidor, diretamente chamadas pelo frontend.

**Exemplo:** `lib/actions/clientes.ts`

```typescript
'use server' // ← indica que esta função roda no servidor

export async function criarCliente(prevState: any, formData: FormData) {
  // 1. Verifica autenticação
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId) return { erro: 'Não autenticado' }

  // 2. Extrai dados do formulário
  const nome = formData.get('nome') as string

  // 3. Salva no banco
  const { data, error } = await supabase
    .from('clientes')
    .insert({ escritorio_id: escritorioId, nome })
    .select()
    .single()

  // 4. Atualiza a tela automaticamente
  revalidatePath('/clientes')

  return { sucesso: true }
}
```

O formulário no frontend é simples:
```tsx
<form action={criarCliente}>
  <input name="nome" />
  <button type="submit">Salvar</button>
</form>
```

Quando o usuário clica em "Salvar", o Next.js serializa o formulário, envia para o servidor, a função roda, salva no banco, e a página é atualizada automaticamente (`revalidatePath`). **Sem useState, sem fetch, sem useEffect.**

---

## 8. O Módulo de IA Jurídica

### Como funciona o chat

O assistente jurídico usa **DeepSeek R1** (modelo de IA da DeepSeek, similar ao GPT-4) com **streaming** — o texto aparece palavra por palavra, como no ChatGPT.

**Arquivo:** `lib/ai.ts`
```typescript
import { createOpenAI } from '@ai-sdk/openai'

// DeepSeek usa a mesma API do OpenAI — só muda a URL base
const deepseek = createOpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com/v1',
})

export const legalModel = deepseek('deepseek-reasoner')
```

**Arquivo:** `app/api/chat/route.ts`
```typescript
export async function POST(req: Request) {
  const { messages } = await req.json()

  const result = await streamText({
    model: legalModel,
    messages,
    system: `Você é um Desembargador Brasileiro Sênior.
    Sua linguagem deve ser formal, técnica e baseada no CPC/2015.
    Ao analisar textos: identifique contradições, cite artigos de lei.
    Nunca invente números de processos ou leis que não existem.`,
  })

  return result.toDataStreamResponse() // Streaming de texto
}
```

**No frontend** (`app/(dashboard)/ia/page.tsx`), o hook `useChat` do Vercel AI SDK gerencia tudo:
```typescript
const { messages, input, handleSubmit, isLoading } = useChat({
  api: '/api/chat', // Chama o endpoint acima
})
// messages: array com o histórico da conversa
// isLoading: true enquanto a IA está "digitando"
```

### Análise de processo via IA

Quando o advogado clica em "Analisar com IA" dentro de um processo, o sistema:
1. Busca todas as movimentações daquele processo (`/api/processos/[id]/movimentacoes`)
2. Formata como texto e envia como primeira mensagem para a IA
3. A IA analisa automaticamente e devolve uma análise jurídica

---

## 9. Sistema de Notificações

### E-mail via Resend

**Arquivo:** `lib/notificacoes/email.ts`

O Resend é acionado quando:
- Uma nova movimentação é adicionada a um processo
- Um prazo está próximo do vencimento

```typescript
await resend.emails.send({
  from: process.env.RESEND_FROM_EMAIL,
  to: destinatario,
  subject: 'Nova movimentação no processo',
  html: `<h2>${processo}</h2><p>${descricao}</p>`,
})
```

### WhatsApp via Z-API

**Arquivo:** `lib/notificacoes/whatsapp.ts`

O Z-API conecta a um número de WhatsApp real e envia mensagens automaticamente:

```typescript
await fetch(`https://api.z-api.io/instances/${instanceId}/send-text`, {
  method: 'POST',
  body: JSON.stringify({
    phone: numeroCliente,
    message: `📋 Nova movimentação no processo ${cnj}:\n${descricao}`
  })
})
```

**Status atual:** código pronto, aguardando configuração das credenciais Z-API no `.env.local`.

---

## 10. Cálculo de Prazos

O módulo de prazos tem uma lógica especial: calcular datas levando em conta **dias úteis** (excluindo fins de semana).

**Arquivo:** `lib/actions/prazos.ts`

```typescript
function calcularDataVencimento(
  dataInicio: Date,
  quantidadeDias: number,
  diasUteis: boolean
): Date {
  if (!diasUteis) {
    // Simples: só soma os dias corridos
    return addDays(dataInicio, quantidadeDias)
  }

  // Dias úteis: pula sábado e domingo
  let data = new Date(dataInicio)
  let diasContados = 0

  while (diasContados < quantidadeDias) {
    data = addDays(data, 1)
    const diaSemana = data.getDay() // 0 = domingo, 6 = sábado
    if (diaSemana !== 0 && diaSemana !== 6) {
      diasContados++ // Só conta se for dia útil
    }
  }

  return data
}
```

Na tela de prazos, eles são exibidos em grupos:
- **Vencidos** (vermelho) — data já passou
- **Vence hoje** (amarelo) — vence hoje
- **Próximos 7 dias** (laranja) — urgente
- **Futuros** (verde) — folgado
- **Concluídos** (cinza) — já resolvidos

---

## 11. O Layout e a Navegação

### Por que o login funciona sem tela branca?

Este foi o problema mais difícil de resolver. A solução está em entender como o Next.js App Router renderiza:

```
app/layout.tsx          ← Nível 1: só configura Clerk e fonte (instantâneo)
    ↓
app/(dashboard)/layout.tsx   ← Nível 2: renderiza sidebar + header (instantâneo)
    ↓
app/(dashboard)/loading.tsx  ← Nível 3: mostra spinner enquanto...
    ↓
app/(dashboard)/dashboard/page.tsx  ← ...esta página carrega (lento, vai ao banco)
```

**O erro anterior:** o `layout.tsx` fazia uma consulta ao Supabase antes de renderizar. Como o layout está **fora** da fronteira do `loading.tsx`, o browser ficava em branco durante essa consulta.

**A solução:** o layout não faz mais nenhuma consulta. Ele renderiza a estrutura visual (sidebar + header) imediatamente. Cada página faz suas próprias consultas, e estas estão cobertas pelo `loading.tsx`.

### Hard Redirect após login

Outro problema resolvido: após o login, o Clerk fazia uma navegação **client-side** (sem recarregar a página). O Next.js usava o cache da página anterior e o servidor não reconhecia a nova sessão.

**Solução no `app/layout.tsx`:**
```tsx
<ClerkProvider
  signInForceRedirectUrl="/dashboard"   // ← Hard redirect (recarrega a página)
  signUpForceRedirectUrl="/onboarding"  // ← Garante que o servidor veja a nova sessão
>
```

---

## 12. Upload de Documentos

**Arquivo:** `components/upload-documento.tsx`

O upload usa o **Supabase Storage** (similar ao AWS S3). O fluxo é:

```
Usuário seleciona arquivo
        ↓
Frontend converte para base64 ou envia como FormData
        ↓
Server Action recebe o arquivo
        ↓
Supabase Storage salva o arquivo em um bucket chamado "documentos"
        ↓
Salva no banco a URL pública do arquivo (tabela documentos_cliente)
        ↓
Frontend exibe o link para download
```

---

## 13. Segurança — Resumo das Camadas

O sistema tem 4 camadas de segurança:

| Camada | Onde fica | O que faz |
|--------|-----------|-----------|
| **Middleware** | `middleware.ts` | Bloqueia qualquer rota não pública para usuários não logados |
| **Verificação de sessão** | `lib/auth.ts` | Confirma que o usuário tem escritório vinculado |
| **Filtro manual** | Todas as queries | Sempre filtra por `escritorio_id` |
| **RLS no banco** | Supabase | Última barreira — o banco recusa dados de outros escritórios |

A `SUPABASE_SERVICE_ROLE_KEY` é a única chave com acesso total. Ela:
- Existe **apenas** no servidor (variável sem `NEXT_PUBLIC_`)
- É usada **apenas** em Server Actions e Server Components
- **Nunca** é exposta ao navegador do usuário

---

## 14. Variáveis de Ambiente

O arquivo `.env.local` contém todas as configurações sensíveis. **Nunca deve ser commitado no Git.**

```bash
# Clerk — autenticação
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...  # Pode ser exposta (prefixo NEXT_PUBLIC_)
CLERK_SECRET_KEY=sk_test_...                   # SECRETA — apenas servidor

# Supabase — banco de dados
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co   # URL pública do projeto
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...               # Chave pública (limitada pelo RLS)
SUPABASE_SERVICE_ROLE_KEY=eyJ...                   # SECRETA — acesso total ao banco

# IA
DEEPSEEK_API_KEY=sk-...  # Chave da API do DeepSeek

# E-mail
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@seudominio.com

# WhatsApp
ZAPI_INSTANCE_ID=...
ZAPI_TOKEN=...
ZAPI_CLIENT_TOKEN=...
```

**Regra:** variáveis com `NEXT_PUBLIC_` podem ser vistas pelo browser. Sem esse prefixo, são exclusivas do servidor.

---

## 15. Fluxo Completo do Usuário

```
1. Acessa jurisflow.com
        ↓
2. Middleware verifica: não logado → redireciona para /sign-in
        ↓
3. Usuário faz login com e-mail/senha (Clerk)
        ↓
4. Clerk faz hard redirect para /dashboard
        ↓
5. Middleware: logado ✓, passa
        ↓
6. Dashboard layout renderiza: sidebar + header (instantâneo)
        ↓
7. Loading.tsx mostra spinner
        ↓
8. Dashboard page.tsx roda no servidor:
   → getAuthContext(): Clerk userId → busca escritorioId no Supabase
   → 4 queries paralelas: processos, prazos, movimentações recentes, clientes
        ↓
9. HTML com dados chega ao browser → spinner some → dashboard aparece
        ↓
10. Usuário usa o sistema normalmente
    - Navegar entre páginas: soft navigation (sem recarregar)
    - Salvar dados: Server Action → banco → revalidatePath → página atualiza
    - Chat IA: POST /api/chat → streaming de resposta
```

---

## 16. O que Falta Implementar

| Item | Complexidade | Estimativa |
|------|-------------|-----------|
| Página "Editar Processo" | Baixa | 2-4h |
| Ativar WhatsApp (Z-API) | Baixa | 1h |
| Convidar membros ao escritório | Média | 1-2 dias |
| Integração DataJud (CNJ) | Alta | 3-5 dias |
| Sistema de assinatura (Stripe) | Alta | 1 semana |
| Gerador de documentos/petições | Muito alta | 2+ semanas |

---

## Para Rodar Localmente

```bash
# 1. Clonar o repositório
git clone https://github.com/seu-usuario/jurisflow.git
cd jurisflow

# 2. Instalar dependências
pnpm install

# 3. Copiar e preencher as variáveis de ambiente
cp .env.local.example .env.local
# Editar .env.local com suas chaves (Clerk, Supabase, etc.)

# 4. Executar o schema no Supabase
# Acessar supabase.com → seu projeto → SQL Editor
# Copiar e executar database/schema.sql
# Copiar e executar database/schema_v2_financeiro.sql

# 5. Rodar o servidor de desenvolvimento
pnpm dev
# Abrir http://localhost:3000
```

---

*Documento gerado em março de 2026. Versão do projeto: JurisFlow v0.1*
