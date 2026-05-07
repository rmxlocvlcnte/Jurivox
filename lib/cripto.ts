// ═══════════════════════════════════════════════════════════════════════════
// lib/cripto.ts — Criptografia de campos sensíveis (Field-Level Encryption)
//
// Algoritmo: AES-256-GCM (autenticado — detecta adulteração)
// Formato armazenado: v1:<iv_b64>:<tag_b64>:<ciphertext_b64>
// O prefixo "v1:" permite migração futura de algoritmo.
//
// VARIÁVEIS DE AMBIENTE OBRIGATÓRIAS:
//   ENCRYPTION_KEY  = 64 caracteres hex (32 bytes) — chave AES
//   HMAC_SECRET     = 64 caracteres hex (32 bytes) — chave HMAC para busca
//
// GERAR CHAVES:
//   node scripts/gerar-chave.mjs
// ═══════════════════════════════════════════════════════════════════════════

import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'crypto'

const ALGORITMO   = 'aes-256-gcm'
const IV_BYTES    = 12   // IV padrão do GCM (NIST SP 800-38D)
const TAG_BYTES   = 16   // Tag de autenticação GCM
const VERSAO      = 'v1'
const SEP         = ':'

// ── Funções de chave ──────────────────────────────────────────────────────

function obterChaveEncriptacao(): Buffer {
  const hex = process.env.ENCRYPTION_KEY
  if (!hex || hex.length !== 64) {
    throw new Error(
      'ENCRYPTION_KEY ausente ou inválida. ' +
      'Gere com: node scripts/gerar-chave.mjs'
    )
  }
  return Buffer.from(hex, 'hex')
}

function obterChaveHmac(): Buffer {
  const hex = process.env.HMAC_SECRET
  if (!hex || hex.length !== 64) {
    throw new Error(
      'HMAC_SECRET ausente ou inválido. ' +
      'Gere com: node scripts/gerar-chave.mjs'
    )
  }
  return Buffer.from(hex, 'hex')
}

// ── Detecção de formato ───────────────────────────────────────────────────

export function estaEncriptado(valor: string): boolean {
  return valor.startsWith(`${VERSAO}${SEP}`) && valor.split(SEP).length === 4
}

// ── Encriptação ───────────────────────────────────────────────────────────

/**
 * Encripta um texto com AES-256-GCM.
 * Retorna: "v1:<iv>:<authTag>:<ciphertext>" em base64.
 * Cada chamada gera um IV diferente (não determinístico).
 */
export function encriptar(plaintext: string): string {
  const chave = obterChaveEncriptacao()
  const iv    = randomBytes(IV_BYTES)

  const cipher    = createCipheriv(ALGORITMO, chave, iv, { authTagLength: TAG_BYTES })
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag       = cipher.getAuthTag()

  return [
    VERSAO,
    iv.toString('base64'),
    tag.toString('base64'),
    encrypted.toString('base64'),
  ].join(SEP)
}

/**
 * Encripta apenas se o valor não for null/undefined/vazio.
 */
export function encriptarOpcional(valor: string | null | undefined): string | null {
  if (!valor) return null
  return encriptar(valor)
}

// ── Decriptação ───────────────────────────────────────────────────────────

/**
 * Decripta uma string no formato "v1:<iv>:<tag>:<data>".
 * A tag de autenticação garante que o ciphertext não foi adulterado.
 * Lança erro se o formato for inválido ou a tag não bater.
 */
export function decriptar(cifrado: string): string {
  const partes = cifrado.split(SEP)
  if (partes.length !== 4 || partes[0] !== VERSAO) {
    throw new Error('Formato de ciphertext inválido. Esperado: v1:<iv>:<tag>:<data>')
  }

  const [, ivB64, tagB64, dataB64] = partes
  const chave = obterChaveEncriptacao()
  const iv    = Buffer.from(ivB64, 'base64')
  const tag   = Buffer.from(tagB64, 'base64')
  const data  = Buffer.from(dataB64, 'base64')

  const decipher = createDecipheriv(ALGORITMO, chave, iv, { authTagLength: TAG_BYTES })
  decipher.setAuthTag(tag)

  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8')
}

/**
 * Decripta se o valor estiver no formato encriptado.
 * Retorna null se o valor for null/undefined/vazio.
 * Retorna o valor original (plaintext) se não estiver encriptado —
 * útil durante a migração de dados legados.
 */
export function decriptarOpcional(valor: string | null | undefined): string | null {
  if (!valor) return null
  if (!estaEncriptado(valor)) return valor   // compatibilidade com dados legados
  return decriptar(valor)
}

// ── Hash para busca (HMAC-SHA256) ─────────────────────────────────────────
//
// Por que HMAC e não criptografia?
//   - O AES-GCM com IV aleatório é não-determinístico: o mesmo CPF gera
//     ciphertexts diferentes a cada chamada, impossibilitando WHERE em SQL.
//   - HMAC-SHA256 é determinístico: mesmo input → mesmo output → permite
//     busca exata no banco (WHERE cpf_busca = hashBusca(cpfInformado)).
//   - HMAC não é reversível: mesmo com acesso ao banco, não dá para
//     recuperar o CPF a partir do hash sem a chave HMAC_SECRET.
//
// Uso: campos que precisam de busca exata: CPF, e-mail de membro, etc.

export function hashBusca(valor: string): string {
  const normalizado = valor.trim().toLowerCase()
  return createHmac('sha256', obterChaveHmac())
    .update(normalizado, 'utf8')
    .digest('hex')
}

export function hashBuscaOpcional(valor: string | null | undefined): string | null {
  if (!valor) return null
  return hashBusca(valor)
}

// ── Helpers por entidade ──────────────────────────────────────────────────
//
// Cada helper encapsula quais campos de uma tabela são criptografados,
// para evitar esquecer um campo ao inserir/atualizar.

/** Campos PII de clientes que devem ser encriptados antes de salvar no banco. */
export function encriptarCliente<T extends {
  cpf?: string | null
  rg?: string | null
  email?: string | null
  telefone?: string | null
  whatsapp?: string | null
  endereco?: string | null
  cidade?: string | null
  estado?: string | null
  observacoes?: string | null
}>(dados: T): T & { cpf_busca: string | null; email_busca: string | null } {
  return {
    ...dados,
    cpf:          encriptarOpcional(dados.cpf),
    rg:           encriptarOpcional(dados.rg),
    email:        encriptarOpcional(dados.email),
    telefone:     encriptarOpcional(dados.telefone),
    whatsapp:     encriptarOpcional(dados.whatsapp),
    endereco:     encriptarOpcional(dados.endereco),
    cidade:       encriptarOpcional(dados.cidade),
    estado:       encriptarOpcional(dados.estado),
    observacoes:  encriptarOpcional(dados.observacoes),
    // Hashes para busca exata por CPF e e-mail
    cpf_busca:    hashBuscaOpcional(dados.cpf),
    email_busca:  hashBuscaOpcional(dados.email),
  }
}

/** Decripta todos os campos PII de um cliente recuperado do banco. */
export function decriptarCliente<T extends {
  cpf?: string | null
  rg?: string | null
  email?: string | null
  telefone?: string | null
  whatsapp?: string | null
  endereco?: string | null
  cidade?: string | null
  estado?: string | null
  observacoes?: string | null
  cpf_busca?: string | null
  email_busca?: string | null
}>(row: T): Omit<T, 'cpf_busca' | 'email_busca'> {
  const { cpf_busca: _cb, email_busca: _eb, ...rest } = row as T & {
    cpf_busca?: string | null
    email_busca?: string | null
  }
  return {
    ...rest,
    cpf:         decriptarOpcional(row.cpf),
    rg:          decriptarOpcional(row.rg),
    email:       decriptarOpcional(row.email),
    telefone:    decriptarOpcional(row.telefone),
    whatsapp:    decriptarOpcional(row.whatsapp),
    endereco:    decriptarOpcional(row.endereco),
    cidade:      decriptarOpcional(row.cidade),
    estado:      decriptarOpcional(row.estado),
    observacoes: decriptarOpcional(row.observacoes),
  }
}

/** Encripta campos PII de membro antes de salvar. */
export function encriptarMembro<T extends {
  email?: string | null
  telefone?: string | null
}>(dados: T): T & { email_busca: string | null } {
  return {
    ...dados,
    email:       encriptarOpcional(dados.email),
    telefone:    encriptarOpcional(dados.telefone),
    email_busca: hashBuscaOpcional(dados.email),
  }
}

/** Decripta campos PII de membro. */
export function decriptarMembro<T extends {
  email?: string | null
  telefone?: string | null
  email_busca?: string | null
}>(row: T): Omit<T, 'email_busca'> {
  const { email_busca: _, ...rest } = row as T & { email_busca?: string | null }
  return {
    ...rest,
    email:    decriptarOpcional(row.email),
    telefone: decriptarOpcional(row.telefone),
  }
}

/** Encripta campos PII do escritório antes de salvar. */
export function encriptarEscritorio<T extends {
  cnpj?: string | null
  email?: string | null
  telefone?: string | null
}>(dados: T): T {
  return {
    ...dados,
    cnpj:     encriptarOpcional(dados.cnpj),
    email:    encriptarOpcional(dados.email),
    telefone: encriptarOpcional(dados.telefone),
  }
}

/** Decripta campos PII do escritório. */
export function decriptarEscritorio<T extends {
  cnpj?: string | null
  email?: string | null
  telefone?: string | null
}>(row: T): T {
  return {
    ...row,
    cnpj:     decriptarOpcional(row.cnpj),
    email:    decriptarOpcional(row.email),
    telefone: decriptarOpcional(row.telefone),
  }
}
