import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateText } from 'ai'
import { legalModel } from '@/lib/ai'
import { MODOS } from '@/lib/ai-prompts'

export const maxDuration = 60

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 })

  const { id } = await params
  const supabase = createAdminClient()

  // Busca o processo e suas movimentações
  const [{ data: processo }, { data: movimentacoes }] = await Promise.all([
    supabase
      .from('processos')
      .select('numero_cnj, tribunal, area_juridica, status, valor_causa, descricao, data_distribuicao')
      .eq('id', id)
      .maybeSingle(),
    supabase
      .from('movimentacoes')
      .select('tipo, descricao, data_movimentacao')
      .eq('processo_id', id)
      .order('data_movimentacao', { ascending: false })
      .limit(20),
  ])

  if (!processo) {
    return NextResponse.json({ erro: 'Processo não encontrado.' }, { status: 404 })
  }

  const areaLabel: Record<string, string> = {
    civil: 'Cível', criminal: 'Criminal', trabalhista: 'Trabalhista',
    previdenciario: 'Previdenciário', tributario: 'Tributário', outro: 'Outro',
  }

  const resumoMovimentacoes = (movimentacoes ?? [])
    .map(m => `[${new Date(m.data_movimentacao).toLocaleDateString('pt-BR')}] ${m.tipo.toUpperCase()}: ${m.descricao}`)
    .join('\n')

  const prompt = `Analise o risco do seguinte processo judicial brasileiro:

DADOS DO PROCESSO:
- Número CNJ: ${processo.numero_cnj}
- Tribunal: ${processo.tribunal}
- Área Jurídica: ${areaLabel[processo.area_juridica] ?? processo.area_juridica}
- Status: ${processo.status}
${processo.valor_causa ? `- Valor da Causa: R$ ${Number(processo.valor_causa).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}
${processo.data_distribuicao ? `- Data de Distribuição: ${new Date(processo.data_distribuicao).toLocaleDateString('pt-BR')}` : ''}
${processo.descricao ? `- Descrição: ${processo.descricao}` : ''}

ÚLTIMAS MOVIMENTAÇÕES:
${resumoMovimentacoes || 'Nenhuma movimentação registrada.'}

Forneça a análise de risco completa seguindo o formato do sistema.
Seja específico ao Direito Brasileiro e ao tribunal/área indicados.`

  try {
    const { text } = await generateText({
      model: legalModel,
      system: MODOS['analise-risco'].systemPrompt,
      prompt,
    })

    return NextResponse.json({ analise: text })
  } catch (err) {
    console.error('[analise-risco] erro:', err)
    return NextResponse.json({ erro: 'Erro ao gerar análise de risco.' }, { status: 500 })
  }
}
