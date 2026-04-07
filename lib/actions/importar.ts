'use server'

import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { exigirCargo, CARGOS_OPERACIONAIS } from '@/lib/permissoes'

// ─── IMPORTAR CLIENTES ─────────────────────────────────────────────────────

const ClienteImportSchema = z.object({
  nome: z.string().min(2, 'Nome obrigatório').max(200),
  cpf: z.string().max(20).optional().nullable(),
  email: z.string().email('E-mail inválido').optional().nullable().or(z.literal('')),
  telefone: z.string().max(20).optional().nullable(),
  whatsapp: z.string().max(20).optional().nullable(),
  endereco: z.string().max(300).optional().nullable(),
  cidade: z.string().max(100).optional().nullable(),
  estado: z.string().max(2).optional().nullable(),
})

export async function importarClientes(rows: Record<string, string>[]) {
  const { escritorioId, cargo, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const perm = exigirCargo(cargo, CARGOS_OPERACIONAIS, 'Sem permissão para importar clientes.')
  if (perm) return perm

  const importados: string[] = []
  const erros: string[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const parse = ClienteImportSchema.safeParse({
      nome: row.nome?.trim(),
      cpf: row.cpf?.trim() || null,
      email: row.email?.trim() || null,
      telefone: row.telefone?.trim() || null,
      whatsapp: row.whatsapp?.trim() || null,
      endereco: row.endereco?.trim() || null,
      cidade: row.cidade?.trim() || null,
      estado: row.estado?.trim()?.toUpperCase().slice(0, 2) || null,
    })

    if (!parse.success) {
      erros.push(`Linha ${i + 2}: ${parse.error.issues[0]?.message ?? 'Dados inválidos'} (${row.nome ?? 'sem nome'})`)
      continue
    }

    const { error } = await supabase
      .from('clientes')
      .insert({ ...parse.data, escritorio_id: escritorioId })

    if (error) {
      if (error.code === '23505') {
        erros.push(`Linha ${i + 2}: CPF já cadastrado (${parse.data.nome})`)
      } else {
        erros.push(`Linha ${i + 2}: Erro ao salvar ${parse.data.nome}`)
      }
    } else {
      importados.push(parse.data.nome)
    }
  }

  revalidatePath('/clientes')
  return { importados: importados.length, erros }
}

// ─── IMPORTAR PROCESSOS ────────────────────────────────────────────────────

const ProcessoImportSchema = z.object({
  numero_cnj: z.string().min(3, 'Número CNJ obrigatório').max(100),
  tribunal: z.string().min(2, 'Tribunal obrigatório').max(100),
  vara: z.string().max(200).optional().nullable(),
  area_juridica: z.enum(['civil', 'criminal', 'trabalhista', 'previdenciario', 'tributario', 'outro'])
    .default('outro'),
  status: z.enum(['ativo', 'arquivado', 'encerrado']).default('ativo'),
  assunto: z.string().max(500).optional().nullable(),
  observacoes: z.string().max(2000).optional().nullable(),
})

export async function importarProcessos(rows: Record<string, string>[]) {
  const { escritorioId, cargo, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const perm = exigirCargo(cargo, CARGOS_OPERACIONAIS, 'Sem permissão para importar processos.')
  if (perm) return perm

  const importados: string[] = []
  const erros: string[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const raw = {
      numero_cnj: row.numero_cnj?.trim(),
      tribunal: row.tribunal?.trim(),
      vara: row.vara?.trim() || null,
      area_juridica: row.area_juridica?.trim().toLowerCase() as any,
      status: row.status?.trim().toLowerCase() as any,
      assunto: row.assunto?.trim() || null,
      observacoes: row.observacoes?.trim() || null,
    }

    const parse = ProcessoImportSchema.safeParse(raw)
    if (!parse.success) {
      erros.push(`Linha ${i + 2}: ${parse.error.issues[0]?.message ?? 'Dados inválidos'} (${row.numero_cnj ?? 'sem CNJ'})`)
      continue
    }

    const { error } = await supabase
      .from('processos')
      .insert({ ...parse.data, escritorio_id: escritorioId })

    if (error) {
      erros.push(`Linha ${i + 2}: Erro ao salvar ${parse.data.numero_cnj}`)
    } else {
      importados.push(parse.data.numero_cnj)
    }
  }

  revalidatePath('/processos')
  return { importados: importados.length, erros }
}
