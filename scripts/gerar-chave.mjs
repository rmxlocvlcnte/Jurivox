#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
// scripts/gerar-chave.mjs — Gerador de chaves criptográficas
// Uso: node scripts/gerar-chave.mjs
// ═══════════════════════════════════════════════════════════════════════════

import { randomBytes } from 'crypto'

const chaveEncriptacao = randomBytes(32).toString('hex')
const chaveHmac        = randomBytes(32).toString('hex')

console.log('\n╔══════════════════════════════════════════════════════════════╗')
console.log('║         CHAVES CRIPTOGRÁFICAS — JURIVOX                     ║')
console.log('╚══════════════════════════════════════════════════════════════╝\n')

console.log('Copie os valores abaixo para o seu .env.local e para as')
console.log('variáveis de ambiente da Vercel (Settings > Environment Variables).\n')

console.log('─── .env.local ────────────────────────────────────────────────')
console.log(`ENCRYPTION_KEY=${chaveEncriptacao}`)
console.log(`HMAC_SECRET=${chaveHmac}`)
console.log('───────────────────────────────────────────────────────────────\n')

console.log('⚠️  ATENÇÃO CRÍTICA:')
console.log('  1. NUNCA compartilhe essas chaves.')
console.log('  2. NUNCA suba o .env.local para o GitHub.')
console.log('  3. Salve as chaves em um gerenciador de senhas (Bitwarden, 1Password).')
console.log('  4. Se perder as chaves, os dados encriptados serão irrecuperáveis.')
console.log('  5. Use chaves DIFERENTES para desenvolvimento e produção.')
console.log('  6. Para rotacionar as chaves: re-encripte todos os dados antes de trocar.\n')

console.log('📋 Como adicionar na Vercel:')
console.log('  vercel env add ENCRYPTION_KEY production')
console.log('  vercel env add HMAC_SECRET production\n')
