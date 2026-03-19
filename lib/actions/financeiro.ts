'use server'

// -----------------------------------------------
// FINANCEIRO — Honorários, pagamentos, fluxo de caixa
// -----------------------------------------------
// Honorários: o contrato de quanto o cliente deve pagar
// Pagamentos: cada parcela paga pelo cliente
// Movimentações: entradas e saídas do escritório
// -----------------------------------------------

import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

// ---- CRIAR HONORÁRIO (contrato de pagamento) ----
export async function criarHonorario(formData: FormData) {
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const dados = {
    escritorio_id: escritorioId,
    processo_id: formData.get('processo_id') as string,
    cliente_id: formData.get('cliente_id') as string,
    tipo: formData.get('tipo') as string, // exito | pro_labore | parcelado
    valor_total: parseFloat(formData.get('valor_total') as string),
    numero_parcelas: parseInt(formData.get('numero_parcelas') as string) || 1,
    descricao: (formData.get('descricao') as string)?.trim() || null,
    status: 'pendente',
  }

  if (!dados.processo_id || isNaN(dados.valor_total)) {
    return { erro: 'Processo e valor total são obrigatórios.' }
  }

  // Verifica que o processo pertence ao escritório
  const { data: processo } = await supabase
    .from('processos')
    .select('id')
    .eq('id', dados.processo_id)
    .eq('escritorio_id', escritorioId)
    .single()

  if (!processo) return { erro: 'Processo não encontrado.' }

  const { error } = await supabase.from('honorarios').insert(dados)

  if (error) {
    console.error('Erro ao criar honorário:', error)
    return { erro: 'Não foi possível criar o honorário.' }
  }

  revalidatePath('/financeiro')
  redirect('/financeiro')
}

// ---- REGISTRAR PAGAMENTO RECEBIDO ----
export async function registrarPagamento(formData: FormData) {
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const dados = {
    honorario_id: formData.get('honorario_id') as string,
    escritorio_id: escritorioId,
    valor: parseFloat(formData.get('valor') as string),
    data_pagamento: formData.get('data_pagamento') as string,
    forma_pagamento: (formData.get('forma_pagamento') as string) || 'pix',
    observacao: (formData.get('observacao') as string)?.trim() || null,
  }

  if (!dados.honorario_id || isNaN(dados.valor) || !dados.data_pagamento) {
    return { erro: 'Honorário, valor e data são obrigatórios.' }
  }

  const { error } = await supabase.from('pagamentos_honorarios').insert(dados)
  if (error) return { erro: 'Não foi possível registrar o pagamento.' }

  revalidatePath('/financeiro')
  redirect('/financeiro')
}

// ---- REGISTRAR MOVIMENTAÇÃO (entrada ou saída) ----
export async function criarMovimentacaoFinanceira(formData: FormData) {
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const dados = {
    escritorio_id: escritorioId,
    tipo: formData.get('tipo') as string, // 'entrada' | 'saida'
    categoria: (formData.get('categoria') as string)?.trim(),
    descricao: (formData.get('descricao') as string)?.trim(),
    valor: parseFloat(formData.get('valor') as string),
    data: formData.get('data') as string,
  }

  if (!dados.tipo || isNaN(dados.valor) || !dados.descricao || !dados.data) {
    return { erro: 'Preencha todos os campos obrigatórios.' }
  }

  const { error } = await supabase.from('movimentacoes_financeiras').insert(dados)
  if (error) {
    console.error('Erro ao criar movimentação:', error)
    return { erro: 'Não foi possível registrar a movimentação.' }
  }

  revalidatePath('/financeiro')
  redirect('/financeiro')
}
