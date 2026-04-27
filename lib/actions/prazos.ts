'use server'

// -----------------------------------------------
// PRAZOS — Criar, concluir e excluir prazos
// -----------------------------------------------

import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { emailNovoPrazo } from '@/lib/notificacoes/email'
import { whatsappNovoPrazo } from '@/lib/notificacoes/whatsapp'
import { z } from 'zod'
import { exigirCargo, CARGOS_OPERACIONAIS } from '@/lib/permissoes'
import { calcularDataVencimentoAsync } from '@/lib/utils/prazos'

const PrazoSchema = z.object({
  processo_id: z.string().uuid('Processo inválido.'),
  descricao: z.string().min(2, 'Descrição obrigatória.').max(500),
  data_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida.'),
  quantidade_dias: z.number().int().min(1, 'Quantidade inválida.').max(3650),
  dias_uteis: z.boolean().default(true),
})

// ---- CRIAR PRAZO ----
export async function criarPrazo(formData: FormData) {
  const { escritorioId, cargo, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const perm = exigirCargo(cargo, CARGOS_OPERACIONAIS, 'Sem permissão para criar prazos.')
  if (perm) return perm

  const parse = PrazoSchema.safeParse({
    processo_id: formData.get('processo_id'),
    descricao: (formData.get('descricao') as string)?.trim(),
    data_inicio: formData.get('data_inicio'),
    quantidade_dias: parseInt(formData.get('quantidade_dias') as string),
    dias_uteis: formData.get('dias_uteis') === 'true',
  })

  if (!parse.success) {
    return { erro: parse.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const dados = parse.data

  const { data: processo } = await supabase
    .from('processos')
    .select('id')
    .eq('id', dados.processo_id)
    .eq('escritorio_id', escritorioId)
    .single()

  if (!processo) return { erro: 'Processo não encontrado.' }

  const dataVencimento = await calcularDataVencimentoAsync(dados.data_inicio, dados.quantidade_dias, dados.dias_uteis)

  const { error } = await supabase
    .from('prazos')
    .insert({
      processo_id: dados.processo_id,
      escritorio_id: escritorioId,
      descricao: dados.descricao,
      data_inicio: dados.data_inicio,
      quantidade_dias: dados.quantidade_dias,
      dias_uteis: dados.dias_uteis,
      data_vencimento: dataVencimento,
    })

  if (error) {
    console.error('Erro ao criar prazo:', error)
    return { erro: 'Não foi possível criar o prazo.' }
  }

  const { data: membro } = await supabase
    .from('membros_escritorio')
    .select('nome, email, telefone')
    .eq('escritorio_id', escritorioId)
    .single()

  const { data: processoData } = await supabase
    .from('processos')
    .select('numero_cnj')
    .eq('id', dados.processo_id)
    .single()

  if (membro && processoData) {
    const hoje = new Date()
    const venc = new Date(dataVencimento + 'T12:00:00')
    const diasRestantes = Math.ceil((venc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))

    if (membro.email) {
      emailNovoPrazo({
        emailAdvogado: membro.email,
        nomeAdvogado: membro.nome,
        numeroCnj: processoData.numero_cnj,
        descricao: dados.descricao,
        dataVencimento,
        diasRestantes,
      }).catch(() => {})
    }

    if (membro.telefone) {
      whatsappNovoPrazo({
        telefoneAdvogado: membro.telefone,
        nomeAdvogado: membro.nome,
        numeroCnj: processoData.numero_cnj,
        descricao: dados.descricao,
        dataVencimento,
        diasRestantes,
      }).catch(() => {})
    }
  }

  revalidatePath('/prazos')
  revalidatePath(`/processos/${dados.processo_id}`)
  redirect('/prazos')
}

// ---- MARCAR PRAZO COMO CONCLUÍDO ----
export async function concluirPrazo(id: string) {
  const { escritorioId, cargo, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const perm = exigirCargo(cargo, CARGOS_OPERACIONAIS, 'Sem permissão para concluir prazos.')
  if (perm) return perm

  const { error } = await supabase
    .from('prazos')
    .update({ concluido: true, concluido_em: new Date().toISOString() })
    .eq('id', id)
    .eq('escritorio_id', escritorioId)

  if (error) return { erro: 'Não foi possível concluir o prazo.' }

  revalidatePath('/prazos')
  revalidatePath('/dashboard')
}

// ---- REABRIR PRAZO ----
export async function reabrirPrazo(id: string) {
  const { escritorioId, cargo, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const perm = exigirCargo(cargo, CARGOS_OPERACIONAIS, 'Sem permissão para reabrir prazos.')
  if (perm) return perm

  const { error } = await supabase
    .from('prazos')
    .update({ concluido: false, concluido_em: null })
    .eq('id', id)
    .eq('escritorio_id', escritorioId)

  if (error) return { erro: 'Não foi possível reabrir o prazo.' }

  revalidatePath('/prazos')
}

// ---- EXCLUIR PRAZO ----
export async function excluirPrazo(id: string) {
  const { escritorioId, cargo, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const perm = exigirCargo(cargo, CARGOS_OPERACIONAIS, 'Sem permissão para excluir prazos.')
  if (perm) return perm

  const { error } = await supabase
    .from('prazos')
    .delete()
    .eq('id', id)
    .eq('escritorio_id', escritorioId)

  if (error) return { erro: 'Não foi possível excluir o prazo.' }

  revalidatePath('/prazos')
  redirect('/prazos')
}
