import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return new Response('Nao autorizado', { status: 401 })

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
  const agora = new Date()
  const em3Dias = new Date()
  em3Dias.setDate(agora.getDate() + 3)

  const hojeInicio = new Date()
  hojeInicio.setHours(0, 0, 0, 0)
  const hojeFim = new Date()
  hojeFim.setHours(23, 59, 59, 999)

  const em3DiasStr = em3Dias.toISOString().split('T')[0]

  const { data: prazos } = await supabase
    .from('prazos')
    .select('id, descricao, data_vencimento, processos(numero_cnj)')
    .eq('escritorio_id', escritorioId)
    .eq('concluido', false)
    .lte('data_vencimento', em3DiasStr)
    .order('data_vencimento', { ascending: true })
    .limit(10)

  const { data: eventos } = await supabase
    .from('agenda_eventos')
    .select('id, titulo, data_inicio, dia_todo, tipo')
    .eq('escritorio_id', escritorioId)
    .eq('concluido', false)
    .gte('data_inicio', hojeInicio.toISOString())
    .lte('data_inicio', hojeFim.toISOString())
    .order('data_inicio', { ascending: true })
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
    const venc = new Date(`${p.data_vencimento}T12:00:00`)
    const dias = Math.floor((venc.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24))

    itens.push({
      id: p.id,
      tipo: dias < 0 ? 'prazo_vencido' : 'prazo_urgente',
      titulo: p.descricao,
      subtitulo: dias < 0
        ? `Vencido ha ${Math.abs(dias)} dia(s) - ${processo?.numero_cnj ?? ''}`
        : dias === 0
          ? `Vence hoje - ${processo?.numero_cnj ?? ''}`
          : `Vence em ${dias} dia(s) - ${processo?.numero_cnj ?? ''}`,
      urgencia: dias < 0 ? 'alta' : dias === 0 ? 'alta' : 'media',
    })
  }

  for (const e of eventos ?? []) {
    const dataInicio = new Date(e.data_inicio)
    const hora = e.dia_todo
      ? 'dia inteiro'
      : dataInicio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

    itens.push({
      id: e.id,
      tipo: 'evento_hoje',
      titulo: e.titulo,
      subtitulo: `Hoje ${hora} - ${e.tipo}`,
      urgencia: 'normal',
    })
  }

  return Response.json({ total: itens.length, itens })
}
