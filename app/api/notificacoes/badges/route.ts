import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return new Response('Não autorizado', { status: 401 })

  const supabase = createAdminClient()

  const { data: membro } = await supabase
    .from('membros_escritorio')
    .select('escritorio_id')
    .eq('clerk_user_id', userId)
    .limit(1)
    .maybeSingle()

  if (!membro?.escritorio_id) {
    return Response.json({ total: 0, itens: [] })
  }

  const escritorioId = membro.escritorio_id
  const hoje = new Date()
  const em3Dias = new Date()
  em3Dias.setDate(hoje.getDate() + 3)

  const hojeStr = hoje.toISOString().split('T')[0]
  const em3DiasStr = em3Dias.toISOString().split('T')[0]

  // Busca prazos vencidos ou vencendo em até 3 dias
  const { data: prazos } = await supabase
    .from('prazos')
    .select('id, descricao, data_vencimento, processos(numero_cnj)')
    .eq('escritorio_id', escritorioId)
    .eq('concluido', false)
    .lte('data_vencimento', em3DiasStr)
    .order('data_vencimento', { ascending: true })
    .limit(10)

  // Busca eventos de hoje
  const { data: eventos } = await supabase
    .from('agenda_eventos')
    .select('id, titulo, hora_inicio, tipo')
    .eq('escritorio_id', escritorioId)
    .eq('concluido', false)
    .eq('data', hojeStr)
    .order('hora_inicio', { ascending: true })
    .limit(5)

  const itens: Array<{
    id: string
    tipo: 'prazo_vencido' | 'prazo_urgente' | 'evento_hoje'
    titulo: string
    subtitulo: string
    urgencia: 'alta' | 'media' | 'normal'
  }> = []

  for (const p of prazos ?? []) {
    const processo = p.processos as any
    const venc = new Date(p.data_vencimento + 'T12:00:00')
    const dias = Math.floor((venc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
    itens.push({
      id: p.id,
      tipo: dias < 0 ? 'prazo_vencido' : 'prazo_urgente',
      titulo: p.descricao,
      subtitulo: dias < 0
        ? `Vencido há ${Math.abs(dias)} dia(s) — ${processo?.numero_cnj ?? ''}`
        : dias === 0
        ? `Vence HOJE — ${processo?.numero_cnj ?? ''}`
        : `Vence em ${dias} dia(s) — ${processo?.numero_cnj ?? ''}`,
      urgencia: dias < 0 ? 'alta' : dias === 0 ? 'alta' : 'media',
    })
  }

  for (const e of eventos ?? []) {
    itens.push({
      id: e.id,
      tipo: 'evento_hoje',
      titulo: e.titulo,
      subtitulo: `Hoje${e.hora_inicio ? ` às ${e.hora_inicio.slice(0, 5)}` : ''} — ${e.tipo}`,
      urgencia: 'normal',
    })
  }

  return Response.json({ total: itens.length, itens })
}
