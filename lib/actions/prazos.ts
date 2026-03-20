'use server'

// -----------------------------------------------
// PRAZOS — Criar, concluir e excluir prazos
// -----------------------------------------------
// Um prazo é uma data limite que o advogado precisa
// cumprir, como: prazo para contestação, recurso, etc.
// -----------------------------------------------

import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { emailNovoPrazo } from '@/lib/notificacoes/email'
import { whatsappNovoPrazo } from '@/lib/notificacoes/whatsapp'

// Calcula data de vencimento somando dias a partir da data início
// Se dias_uteis = true, conta apenas dias de semana (seg-sex)
function calcularVencimento(dataInicio: string, quantidadeDias: number, diasUteis: boolean): string {
  const inicio = new Date(dataInicio + 'T12:00:00') // Meio-dia para evitar problemas de fuso
  let data = new Date(inicio)
  let diasContados = 0

  while (diasContados < quantidadeDias) {
    data.setDate(data.getDate() + 1)
    if (diasUteis) {
      // Pula fins de semana (0 = domingo, 6 = sábado)
      const diaSemana = data.getDay()
      if (diaSemana !== 0 && diaSemana !== 6) {
        diasContados++
      }
    } else {
      diasContados++
    }
  }

  return data.toISOString().split('T')[0] // Retorna só a data: "YYYY-MM-DD"
}

// ---- CRIAR PRAZO ----
export async function criarPrazo(formData: FormData) {
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const processoId = formData.get('processo_id') as string
  const descricao = (formData.get('descricao') as string)?.trim()
  const dataInicio = formData.get('data_inicio') as string
  const quantidadeDias = parseInt(formData.get('quantidade_dias') as string)
  const diasUteis = formData.get('dias_uteis') === 'true'

  if (!processoId || !descricao || !dataInicio || isNaN(quantidadeDias)) {
    return { erro: 'Preencha todos os campos obrigatórios.' }
  }

  // Verifica que o processo pertence ao escritório
  const { data: processo } = await supabase
    .from('processos')
    .select('id')
    .eq('id', processoId)
    .eq('escritorio_id', escritorioId)
    .single()

  if (!processo) return { erro: 'Processo não encontrado.' }

  const dataVencimento = calcularVencimento(dataInicio, quantidadeDias, diasUteis)

  const { error } = await supabase
    .from('prazos')
    .insert({
      processo_id: processoId,
      escritorio_id: escritorioId,
      descricao,
      data_inicio: dataInicio,
      quantidade_dias: quantidadeDias,
      dias_uteis: diasUteis,
      data_vencimento: dataVencimento,
    })

  if (error) {
    console.error('Erro ao criar prazo:', error)
    return { erro: 'Não foi possível criar o prazo.' }
  }

  // Busca advogado responsável para notificação
  const { data: membro } = await supabase
    .from('membros_escritorio')
    .select('nome, email, telefone')
    .eq('escritorio_id', escritorioId)
    .single()

  const { data: processoData } = await supabase
    .from('processos')
    .select('numero_cnj')
    .eq('id', processoId)
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
        descricao,
        dataVencimento,
        diasRestantes,
      }).catch(() => {})
    }

    if (membro.telefone) {
      whatsappNovoPrazo({
        telefoneAdvogado: membro.telefone,
        nomeAdvogado: membro.nome,
        numeroCnj: processoData.numero_cnj,
        descricao,
        dataVencimento,
        diasRestantes,
      }).catch(() => {})
    }
  }

  revalidatePath('/prazos')
  revalidatePath(`/processos/${processoId}`)
  redirect('/prazos')
}

// ---- MARCAR PRAZO COMO CONCLUÍDO ----
export async function concluirPrazo(id: string) {
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const { error } = await supabase
    .from('prazos')
    .update({ concluido: true, concluido_em: new Date().toISOString() })
    .eq('id', id)
    .eq('escritorio_id', escritorioId)

  if (error) return { erro: 'Não foi possível concluir o prazo.' }

  revalidatePath('/prazos')
  revalidatePath('/dashboard')
}

// ---- REABRIR PRAZO (desfazer conclusão) ----
export async function reabrirPrazo(id: string) {
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  await supabase
    .from('prazos')
    .update({ concluido: false, concluido_em: null })
    .eq('id', id)
    .eq('escritorio_id', escritorioId)

  revalidatePath('/prazos')
}

// ---- EXCLUIR PRAZO ----
export async function excluirPrazo(id: string) {
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  await supabase
    .from('prazos')
    .delete()
    .eq('id', id)
    .eq('escritorio_id', escritorioId)

  revalidatePath('/prazos')
  redirect('/prazos')
}
