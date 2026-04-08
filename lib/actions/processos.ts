'use server'

import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { emailNovaMovimentacao } from '@/lib/notificacoes/email'
import { whatsappNovaMovimentacao } from '@/lib/notificacoes/whatsapp'
import { z } from 'zod'
import { exigirCargo, CARGOS_OPERACIONAIS } from '@/lib/permissoes'
import { verificarLimitePlano } from '@/lib/planos-limites'

const ProcessoSchema = z.object({
  cliente_id: z.string().uuid().optional().nullable(),
  numero_cnj: z.string().min(8, 'Numero CNJ e obrigatorio.'),
  tribunal: z.string().min(2, 'Tribunal e obrigatorio.'),
  vara: z.string().max(100).optional().nullable(),
  classe: z.string().max(200).optional().nullable(),
  area_juridica: z.enum(['civil', 'criminal', 'trabalhista', 'previdenciario', 'tributario', 'outro'] as const, {
    error: 'Area juridica invalida.',
  }),
  delegacia: z.string().max(200).optional().nullable(),
  numero_inquerito: z.string().max(50).optional().nullable(),
  reclamado: z.string().max(200).optional().nullable(),
  numero_beneficio: z.string().max(50).optional().nullable(),
  status: z.enum(['ativo', 'arquivado', 'encerrado'] as const).optional(),
  descricao: z.string().max(2000).optional().nullable(),
  assunto: z.string().max(500).optional().nullable(),
  observacoes: z.string().max(5000).optional().nullable(),
})

const MovimentacaoSchema = z.object({
  descricao: z.string().min(2, 'A descricao e obrigatoria.').max(2000),
  tipo: z.enum(['andamento', 'audiencia', 'sentenca', 'despacho', 'prazo', 'outro'] as const).default('andamento'),
  data_movimentacao: z.string().regex(/^\d{4}-\d{2}-\d{2}/).optional(),
})

function parseProcessoForm(formData: FormData) {
  const descricao = (formData.get('descricao') as string)?.trim() || null
  const observacoes = (formData.get('observacoes') as string)?.trim() || null

  return {
    cliente_id: (formData.get('cliente_id') as string) || null,
    numero_cnj: (formData.get('numero_cnj') as string)?.trim(),
    tribunal: (formData.get('tribunal') as string)?.trim(),
    vara: (formData.get('vara') as string)?.trim() || null,
    classe: (formData.get('classe') as string)?.trim() || null,
    area_juridica: formData.get('area_juridica') as string,
    delegacia: (formData.get('delegacia') as string)?.trim() || null,
    numero_inquerito: (formData.get('numero_inquerito') as string)?.trim() || null,
    reclamado: (formData.get('reclamado') as string)?.trim() || null,
    numero_beneficio: (formData.get('numero_beneficio') as string)?.trim() || null,
    status: (formData.get('status') as string) || 'ativo',
    descricao,
    assunto: (formData.get('assunto') as string)?.trim() || null,
    observacoes: observacoes ?? descricao,
  }
}

export async function criarProcesso(formData: FormData) {
  const { escritorioId, membroId, cargo, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const perm = exigirCargo(cargo, CARGOS_OPERACIONAIS, 'Sem permissao para criar processos.')
  if (perm) return perm

  const parse = ProcessoSchema.safeParse(parseProcessoForm(formData))
  if (!parse.success) {
    return { erro: parse.error.issues[0]?.message ?? 'Dados invalidos.' }
  }

  const limite = await verificarLimitePlano({
    escritorioId,
    recurso: 'processos',
    supabase,
  })
  if (limite) return limite

  const { data: processo, error } = await supabase
    .from('processos')
    .insert({
      escritorio_id: escritorioId,
      responsavel_id: membroId,
      ...parse.data,
    })
    .select('id')
    .single()

  if (error || !processo) {
    console.error('Erro ao criar processo:', error)
    return { erro: 'Nao foi possivel criar o processo.' }
  }

  revalidatePath('/processos')
  redirect(`/processos/${processo.id}`)
}

export async function atualizarProcesso(id: string, formData: FormData) {
  const { escritorioId, cargo, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const perm = exigirCargo(cargo, CARGOS_OPERACIONAIS, 'Sem permissao para atualizar processos.')
  if (perm) return perm

  const parse = ProcessoSchema.safeParse(parseProcessoForm(formData))
  if (!parse.success) {
    return { erro: parse.error.issues[0]?.message ?? 'Dados invalidos.' }
  }

  const { error } = await supabase
    .from('processos')
    .update({ ...parse.data, atualizado_em: new Date().toISOString() })
    .eq('id', id)
    .eq('escritorio_id', escritorioId)

  if (error) {
    console.error('Erro ao atualizar processo:', error)
    return { erro: 'Nao foi possivel atualizar o processo.' }
  }

  revalidatePath(`/processos/${id}`)
  revalidatePath('/processos')
  redirect(`/processos/${id}`)
}

export async function excluirProcesso(id: string) {
  const { escritorioId, cargo, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const perm = exigirCargo(cargo, CARGOS_OPERACIONAIS, 'Sem permissao para excluir processos.')
  if (perm) return perm

  const { error } = await supabase
    .from('processos')
    .delete()
    .eq('id', id)
    .eq('escritorio_id', escritorioId)

  if (error) {
    console.error('Erro ao excluir processo:', error)
    return { erro: 'Nao foi possivel excluir o processo.' }
  }

  revalidatePath('/processos')
  redirect('/processos')
}

export async function adicionarMovimentacao(processoId: string, formData: FormData) {
  const { escritorioId, cargo, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const perm = exigirCargo(cargo, CARGOS_OPERACIONAIS, 'Sem permissao para adicionar movimentacoes.')
  if (perm) return perm

  const { data: processo } = await supabase
    .from('processos')
    .select('id')
    .eq('id', processoId)
    .eq('escritorio_id', escritorioId)
    .single()

  if (!processo) return { erro: 'Processo nao encontrado.' }

  const parse = MovimentacaoSchema.safeParse({
    descricao: (formData.get('descricao') as string)?.trim(),
    tipo: (formData.get('tipo') as string) || 'andamento',
    data_movimentacao: (formData.get('data_movimentacao') as string) || undefined,
  })

  if (!parse.success) {
    return { erro: parse.error.issues[0]?.message ?? 'Dados invalidos.' }
  }

  const { error } = await supabase
    .from('movimentacoes')
    .insert({
      processo_id: processoId,
      descricao: parse.data.descricao,
      tipo: parse.data.tipo,
      data_movimentacao: parse.data.data_movimentacao
        ? new Date(parse.data.data_movimentacao).toISOString()
        : new Date().toISOString(),
      fonte: 'manual',
    })

  if (error) {
    console.error('Erro ao adicionar movimentacao:', error)
    return { erro: 'Nao foi possivel adicionar a movimentacao.' }
  }

  const { data: processoCompleto } = await supabase
    .from('processos')
    .select(`
      numero_cnj,
      escritorios (nome),
      clientes (nome, email, telefone)
    `)
    .eq('id', processoId)
    .single()

  if (processoCompleto) {
    const escritorio = processoCompleto.escritorios as unknown as { nome: string } | null
    const cliente = processoCompleto.clientes as unknown as {
      nome: string
      email: string | null
      telefone: string | null
    } | null

    if (cliente?.email) {
      emailNovaMovimentacao({
        emailCliente: cliente.email,
        nomeCliente: cliente.nome,
        nomeEscritorio: escritorio?.nome ?? 'Escritorio',
        numeroCnj: processoCompleto.numero_cnj,
        descricao: parse.data.descricao,
        tipo: parse.data.tipo,
      }).catch(() => {})
    }

    if (cliente?.telefone) {
      whatsappNovaMovimentacao({
        telefoneCliente: cliente.telefone,
        nomeCliente: cliente.nome,
        numeroCnj: processoCompleto.numero_cnj,
        descricao: parse.data.descricao,
        nomeEscritorio: escritorio?.nome ?? 'Escritorio',
      }).catch(() => {})
    }
  }

  revalidatePath(`/processos/${processoId}`)
  redirect(`/processos/${processoId}`)
}
