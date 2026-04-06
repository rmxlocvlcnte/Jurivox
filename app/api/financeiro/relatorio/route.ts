import { getAuthContext } from '@/lib/auth'

function csvEscape(value: unknown) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`
}

export async function GET(req: Request) {
  const { userId, escritorioId, supabase } = await getAuthContext()
  if (!userId || !escritorioId || !supabase) {
    return new Response('Não autorizado', { status: 401 })
  }

  const url = new URL(req.url)
  const de = url.searchParams.get('de')
  const ate = url.searchParams.get('ate')

  const hoje = new Date()
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0]
  const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0]

  const dataDe = de ?? inicioMes
  const dataAte = ate ?? fimMes

  const [{ data: movs }, { data: pagamentos }] = await Promise.all([
    supabase
      .from('movimentacoes_financeiras')
      .select('tipo, categoria, descricao, valor, data')
      .eq('escritorio_id', escritorioId)
      .gte('data', dataDe)
      .lte('data', dataAte)
      .order('data', { ascending: true }),

    supabase
      .from('pagamentos_honorarios')
      .select('valor, data_pagamento, forma_pagamento, honorarios(processos(numero_cnj), clientes(nome))')
      .eq('escritorio_id', escritorioId)
      .gte('data_pagamento', dataDe)
      .lte('data_pagamento', dataAte)
      .order('data_pagamento', { ascending: true }),
  ])

  const linhas = [
    ['tipo_registro', 'data', 'categoria', 'descricao', 'valor', 'detalhes'],
  ]

  movs?.forEach(m => {
    linhas.push([
      'movimentacao',
      m.data,
      m.categoria ?? '',
      m.descricao,
      m.valor,
      m.tipo,
    ])
  })

  pagamentos?.forEach(p => {
    const honorario = p.honorarios as any
    const cliente = honorario?.clientes as any
    const processo = honorario?.processos as any
    linhas.push([
      'pagamento_honorario',
      p.data_pagamento,
      p.forma_pagamento ?? '',
      `Processo ${processo?.numero_cnj ?? ''} · ${cliente?.nome ?? ''}`.trim(),
      p.valor,
      'recebido',
    ])
  })

  const csv = linhas.map(l => l.map(csvEscape).join(',')).join('\n')
  const filename = `relatorio_financeiro_${dataDe}_a_${dataAte}.csv`

  return new Response('\uFEFF' + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename=\"${filename}\"`,
    },
  })
}
