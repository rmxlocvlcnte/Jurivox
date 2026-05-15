#!/usr/bin/env node
/**
 * Sincroniza variáveis do .env.local para a Vercel automaticamente.
 *
 * Uso:
 *   VERCEL_TOKEN=xxxxxx VERCEL_PROJECT_ID=prj_xxxxx pnpm run sync-env
 *
 * Ou com org:
 *   VERCEL_TOKEN=xxx VERCEL_ORG_ID=team_xxx VERCEL_PROJECT_ID=prj_xxx pnpm run sync-env
 *
 * Onde obter:
 *   Token:      https://vercel.com/account/tokens
 *   Project ID: Vercel Dashboard → Seu projeto → Settings → General → Project ID
 */

import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const TOKEN = process.env.VERCEL_TOKEN
const PROJECT_ID = process.env.VERCEL_PROJECT_ID
const ORG_ID = process.env.VERCEL_ORG_ID ?? ''

if (!TOKEN || !PROJECT_ID) {
  console.error('❌ Defina VERCEL_TOKEN e VERCEL_PROJECT_ID antes de rodar este script.')
  console.error('   VERCEL_TOKEN=xxx VERCEL_PROJECT_ID=prj_xxx pnpm run sync-env')
  process.exit(1)
}

const envPath = resolve(process.cwd(), '.env.local')
if (!existsSync(envPath)) {
  console.error('❌ Arquivo .env.local não encontrado.')
  process.exit(1)
}

const content = readFileSync(envPath, 'utf8')

// Parse .env.local — ignora comentários e linhas vazias
const vars = []
for (const line of content.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eqIdx = trimmed.indexOf('=')
  if (eqIdx < 0) continue
  const key = trimmed.slice(0, eqIdx).trim()
  const value = trimmed.slice(eqIdx + 1).trim().replace(/^"|"$/g, '')
  if (!key || !value || value.includes('COLOQUE_AQUI') || value.includes('SEU_')) continue
  vars.push({ key, value })
}

console.log(`\n🔑 Sincronizando ${vars.length} variáveis para Vercel...`)

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  'Content-Type': 'application/json',
  ...(ORG_ID ? { 'x-vercel-org-id': ORG_ID } : {}),
}

let ok = 0
let erros = 0

for (const { key, value } of vars) {
  // Determina se é pública (NEXT_PUBLIC_) ou privada
  const target = key.startsWith('NEXT_PUBLIC_')
    ? ['production', 'preview', 'development']
    : ['production', 'preview', 'development']

  const body = {
    key,
    value,
    type: 'encrypted',
    target,
  }

  try {
    const res = await fetch(`https://api.vercel.com/v10/projects/${PROJECT_ID}/env`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    if (res.ok) {
      console.log(`  ✅ ${key}`)
      ok++
    } else if (res.status === 409) {
      // Já existe — faz PATCH para atualizar
      const listRes = await fetch(`https://api.vercel.com/v10/projects/${PROJECT_ID}/env?limit=1000`, { headers })
      const listData = await listRes.json()
      const existing = listData.envs?.find((e) => e.key === key && e.target?.includes('production'))

      if (existing) {
        const patchRes = await fetch(`https://api.vercel.com/v10/projects/${PROJECT_ID}/env/${existing.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ value, type: 'encrypted', target }),
        })
        if (patchRes.ok) {
          console.log(`  🔄 ${key} (atualizado)`)
          ok++
        } else {
          console.log(`  ⚠️  ${key} (erro ao atualizar: ${patchRes.status})`)
          erros++
        }
      }
    } else {
      const err = await res.json().catch(() => ({}))
      console.log(`  ❌ ${key} — ${err.error?.message ?? res.status}`)
      erros++
    }
  } catch (e) {
    console.log(`  ❌ ${key} — ${e.message}`)
    erros++
  }
}

console.log(`\n✅ ${ok} variáveis sincronizadas`)
if (erros > 0) console.log(`⚠️  ${erros} erros`)

// Dispara um novo deploy
console.log('\n🚀 Disparando novo deploy...')
const deployRes = await fetch(`https://api.vercel.com/v13/deployments`, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    name: 'jurisflow',
    project: PROJECT_ID,
    gitSource: { type: 'github', ref: 'main' },
  }),
})
if (deployRes.ok) {
  const d = await deployRes.json()
  console.log(`✅ Deploy iniciado: https://vercel.com/deployments/${d.id}`)
} else {
  console.log('⚠️  Não foi possível disparar deploy automático — faça manualmente na Vercel.')
}
