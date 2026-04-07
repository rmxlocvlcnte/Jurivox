import { auth } from '@clerk/nextjs/server'
import { getAuthContext } from '@/lib/auth'
import { buscarMovimentacoesDataJud } from '@/lib/monitoramento/datajud'

export async function POST() {
  const { userId } = await auth()
  if (!userId) return new Response('Não autorizado', { status: 401 })

  const { escritorioId, supabase, mfaObrigatorio } = await getAuthContext({ redirecionar2FA: false })
  if (mfaObrigatorio) return new Response('2FA obrigatório', { status: 403 })
  if (!escritorioId || !supabase) return new Response('Sem escritório', { status: 403 })

  if (!process.env.DATAJUD_API_URL) {
    return new Response(JSON.stringify({ erro: 'DATAJUD_API_URL não configurada.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { data: processos } = await supabase
    .from('processos')
    .select('id, numero_cnj')
    .eq('escritorio_id', escritorioId)
    .eq('status', 'ativo')

  let novos = 0
  let erros = 0

  for (const p of processos ?? []) {
    try {
      const movimentos = await buscarMovimentacoesDataJud(p.numero_cnj)
      for (const mov of movimentos) {
        const dataMov = new Date(mov.data)
        if (isNaN(dataMov.getTime())) continue

        const dataIso = dataMov.toISOString()

        const { data: existente } = await supabase
          .from('movimentacoes')
          .select('id')
          .eq('processo_id', p.id)
          .eq('descricao', mov.descricao)
          .eq('data_movimentacao', dataIso)
          .maybeSingle()

        if (existente) continue

        const { error } = await supabase.from('movimentacoes').insert({
          processo_id: p.id,
          descricao: mov.descricao,
          tipo: mov.tipo ?? 'andamento',
          data_movimentacao: dataIso,
          fonte: 'datajud',
        })

        if (!error) novos++
      }
    } catch (e) {
      console.error('[Monitoramento] erro:', e)
      erros++
    }
  }

  return new Response(
    JSON.stringify({ sucesso: true, novos, erros }),
    { headers: { 'Content-Type': 'application/json' } }
  )
}
