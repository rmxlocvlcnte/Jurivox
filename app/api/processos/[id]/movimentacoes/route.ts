// API para buscar movimentações de um processo (usado pela página de IA)
import { getAuthContext } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) return NextResponse.json(null, { status: 401 })

  // Verifica que o processo pertence ao escritório
  const { data: processo } = await supabase
    .from('processos')
    .select('numero_cnj, tribunal, area_juridica, clientes(nome)')
    .eq('id', id)
    .eq('escritorio_id', escritorioId)
    .single()

  if (!processo) return NextResponse.json(null, { status: 404 })

  const { data: movimentacoes } = await supabase
    .from('movimentacoes')
    .select('descricao, tipo, data_movimentacao, fonte')
    .eq('processo_id', id)
    .order('data_movimentacao', { ascending: false })

  // Formata tudo em texto para enviar à IA
  const cliente = (processo.clientes as any)?.nome ?? 'não identificado'
  const linhas = movimentacoes?.map(m => {
    const data = new Date(m.data_movimentacao).toLocaleDateString('pt-BR')
    return `[${data}] (${m.tipo.toUpperCase()}) ${m.descricao}`
  }).join('\n') ?? 'Nenhuma movimentação registrada.'

  const resumo = `PROCESSO: ${processo.numero_cnj}
TRIBUNAL: ${processo.tribunal}
ÁREA: ${processo.area_juridica}
CLIENTE: ${cliente}

MOVIMENTAÇÕES (${movimentacoes?.length ?? 0} registros):
${linhas}`

  return NextResponse.json({ resumo })
}
