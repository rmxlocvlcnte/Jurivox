# Guia de Instalação — JurisFlow

Siga cada passo na ordem. Não pule etapas.

---

## Passo 1 — Instalar os pacotes

Abra o terminal **dentro do VS Code** (Menu Terminal > Novo Terminal) e rode:

```bash
pnpm add @supabase/supabase-js @supabase/ssr @clerk/nextjs
```

Aguarde terminar. Os erros vermelhos no VS Code vão desaparecer após isso.

---

## Passo 2 — Criar o arquivo de variáveis de ambiente

No terminal:

```bash
cp .env.local.example .env.local
```

Abra o arquivo `.env.local` e preencha com suas chaves reais (veja os passos 3 e 4).

---

## Passo 3 — Criar conta e pegar chaves do Clerk

1. Acesse https://clerk.com e crie uma conta gratuita
2. Clique em "Create Application"
3. Dê um nome (ex: JurisFlow) e ative "Email" e "Google" como métodos de login
4. No menu lateral, clique em **API Keys**
5. Copie:
   - `Publishable Key` → cole em `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `Secret Key` → cole em `CLERK_SECRET_KEY`

---

## Passo 4 — Criar conta e pegar chaves do Supabase

1. Acesse https://supabase.com e crie uma conta gratuita
2. Clique em "New Project"
3. Escolha um nome (ex: jurisflow) e uma senha forte para o banco
4. Aguarde o projeto ser criado (~2 minutos)
5. Vá em **Settings > API**
6. Copie:
   - `Project URL` → cole em `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` (em Project API Keys) → cole em `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Passo 5 — Criar as tabelas no Supabase

1. No Supabase, vá em **SQL Editor** (menu lateral)
2. Clique em **New Query**
3. Abra o arquivo `database/schema.sql` deste projeto
4. Copie TODO o conteúdo e cole no editor do Supabase
5. Clique em **Run** (ícone de play)
6. Deve aparecer "Success" em verde

---

## Passo 6 — Rodar o projeto

```bash
pnpm dev
```

Abra http://localhost:3000 no navegador.

Você será redirecionado para a tela de login do Clerk.
Crie uma conta e você verá o Dashboard.

---

## Problemas comuns

**Erro: "Invalid API Key"**
→ Verifique se copiou as chaves corretamente no `.env.local` (sem espaços extras)

**Tela em branco após login**
→ Verifique se rodou o SQL do schema.sql no Supabase

**Erro "Module not found"**
→ Rode `pnpm install` novamente no terminal
