import { getAuthContext } from '@/lib/auth'
import { NextResponse } from 'next/server'

function icsEscape(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

function icsDate(d: string, diaInteiro?: boolean): string {
  const dt = new Date(d)
  if (diaInteiro) {
    const y = dt.getFullYear()
    const m = String(dt.getMonth() + 1).padStart(2, '0')
    const day = String(dt.getDate()).padStart(2, '0')
    return `${y}${m}${day}`
  }
  return dt.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

const TIPO_LABEL: Record<string, string> = {
  audiencia: 'Audiência',
  prazo: 'Prazo',
  providencia: 'Providência',
  reuniao: 'Reunião',
  outro: 'Outro',
}

export async function GET() {
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 })

  const inicio = new Date(new Date().getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()
  const fim    = new Date(new Date().getTime() + 180 * 24 * 60 * 60 * 1000).toISOString()

  const { data: eventos } = await supabase
    .from('agenda_eventos')
    .select('id, titulo, tipo, descricao, data_inicio, dia_todo, concluido')
    .eq('escritorio_id', escritorioId)
    .gte('data_inicio', inicio)
    .lte('data_inicio', fim)
    .order('data_inicio', { ascending: true })

  const agora = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

  const linhas: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Jurivox//Agenda Jurídica//PT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Jurivox — Agenda',
    'X-WR-TIMEZONE:America/Sao_Paulo',
  ]

  for (const ev of eventos ?? []) {
    const tipo = TIPO_LABEL[ev.tipo] ?? ev.tipo
    const uid  = `${ev.id}@jurivox.com.br`
    const titulo = `[${tipo}] ${ev.titulo}`

    linhas.push('BEGIN:VEVENT')
    linhas.push(`UID:${uid}`)
    linhas.push(`DTSTAMP:${agora}`)

    if (ev.dia_todo) {
      linhas.push(`DTSTART;VALUE=DATE:${icsDate(ev.data_inicio, true)}`)
      linhas.push(`DTEND;VALUE=DATE:${icsDate(ev.data_inicio, true)}`)
    } else {
      linhas.push(`DTSTART:${icsDate(ev.data_inicio)}`)
      linhas.push(`DTEND:${icsDate(ev.data_inicio)}`)
    }

    linhas.push(`SUMMARY:${icsEscape(titulo)}`)
    if (ev.descricao) linhas.push(`DESCRIPTION:${icsEscape(ev.descricao)}`)
    if (ev.concluido) linhas.push('STATUS:COMPLETED')
    else linhas.push('STATUS:CONFIRMED')
    linhas.push('END:VEVENT')
  }

  linhas.push('END:VCALENDAR')

  const ics = linhas.join('\r\n')

  return new Response(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="jurivox-agenda.ics"',
      'Cache-Control': 'no-cache',
    },
  })
}
