'use server'

import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { exigirCargo, CARGOS_OPERACIONAIS } from '@/lib/permissoes'

const ContratoSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres.').max(200),
  tipo: z.enum(['fixo', 'hora', 'exito', 'misto'] as const, {
    error: 'Tipo de contrato inválido.',
  }),
  cliente_id: z.string().uuid().optional().nullable(),
  processo_id: z.string().uuid().optional().nullable(),
  responsavel_id: z.string().uuid().optional().nullable(),
  valor_fixo: z.number().positive().max(10_000_000).optional().nullable(),
  valor_hora: z.number().positive().max(100_000).optional().nullable(),
  percentual_exito: z.number().min(0).max(100).optional().nullable(),
  data_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  data_fim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  observacoes: z.string().max(2000).optional().nullable(),
})

function normalizarTipo(tipo: string | null) {
  if (tipo === 'por_hora') return 'hora'
  return tipo
}

function parseContrato(formData: FormData) {
  const clienteId = formData.get('cliente_id') as string
  const processoId = formData.get('processo_id') as string
  const responsavelId = formData.get('responsavel_id') as string
  return {
    nome: (formData.get('nome') as string)?.trim(),
    tipo: normalizarTipo(formData.get('tipo') as string),
    cliente_id: clienteId || null,
    processo_id: processoId || null,
    responsavel_id: responsavelId || null,
    valor_fixo: formData.get('valor_fixo') ? Number(formData.get('valor_fixo')) : null,
    valor_hora: formData.get('valor_hora') ? Number(formData.get('valor_hora')) : null,
    percentual_exito: formData.get('percentual_exito') ? Number(formData.get('percentual_exito')) : null,
    data_inicio: (formData.get('data_inicio') as string) || null,
    data_fim: (formData.get('data_fim') as string) || null,
    observacoes: (formData.get('observacoes') as string)?.trim() || null,
  }
}

export async function criarContrato(formData: FormData) {
  const { escritorioId, cargo, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const perm = exigirCargo(cargo, CARGOS_OPERACIONAIS, 'Sem permissão para criar contratos.')
  if (perm) return perm

  const parse = ContratoSchema.safeParse(parseContrato(formData))
  if (!parse.success) {
    return { erro: parse.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const { data: contrato, error } = await supabase
    .from('contratos')
    .insert({ ...parse.data, escritorio_id: escritorioId, status: 'ativo' })
    .select('id')
    .single()

  if (error || !contrato) {
    console.error('Erro ao criar contrato:', error)
    return { erro: 'Não foi possível cadastrar o contrato.' }
  }

  revalidatePath('/contratos')
  redirect(`/contratos/${contrato.id}`)
}

export async function atualizarContrato(id: string, formData: FormData) {
  const { escritorioId, cargo, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const perm = exigirCargo(cargo, CARGOS_OPERACIONAIS, 'Sem permissão para atualizar contratos.')
  if (perm) return perm

  const raw = { ...parseContrato(formData), status: formData.get('status') as string }
  const parse = ContratoSchema.extend({
    status: z.enum(['ativo', 'suspenso', 'encerrado'] as const).optional(),
  }).safeParse(raw)

  if (!parse.success) {
    return { erro: parse.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const { error } = await supabase
    .from('contratos')
    .update(parse.data)
    .eq('id', id)
    .eq('escritorio_id', escritorioId)

  if (error) return { erro: 'Não foi possível atualizar o contrato.' }

  revalidatePath(`/contratos/${id}`)
  revalidatePath('/contratos')
  redirect(`/contratos/${id}`)
}

export async function excluirContrato(id: string) {
  const { escritorioId, cargo, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const perm = exigirCargo(cargo, CARGOS_OPERACIONAIS, 'Sem permissão para excluir contratos.')
  if (perm) return perm

  const { error } = await supabase
    .from('contratos')
    .delete()
    .eq('id', id)
    .eq('escritorio_id', escritorioId)

  if (error) {
    console.error('Erro ao excluir contrato:', error)
    return { erro: 'Não foi possível excluir o contrato.' }
  }

  revalidatePath('/contratos')
  return { sucesso: true }
}