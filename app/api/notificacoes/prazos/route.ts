// -----------------------------------------------
// API: Notificações de prazos por e-mail e WhatsApp
// -----------------------------------------------
// Envia alertas para prazos que vencem nos próximos N dias.
//
// Uso manual:  POST /api/notificacoes/prazos
// Vercel Cron: adicionar em vercel.json:
//   { "crons": [{ "path": "/api/notificacoes/prazos", "schedule": "0 7 * * *" }] }
//
// Segurança: protegido por CRON_SECRET no header Authorization
// -----------------------------------------------

import { createAdminClient } from '@/lib/supabase/admin'
import { emailNovoPrazo } from '@/lib/notificacoes/email'
import { whatsappLembretePrazo } from '@/lib/notificacoes/whatsapp'

const DIAS_ANTECEDENCIA = 3 // Avisa prazos que vencem em até 3 dias

export async function POST(req: Request) {
  // Verifica secret para evitar chamadas não autorizadas
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${cronSecret}`) {
      return new Response('Não autorizado', { status: 401 })
    }
  }

  const supabase = createAdminClient()

  const hoje = new Date()
  const limite = new Date()
  limite.setDate(hoje.getDate() + DIAS_ANTECEDENCIA)

  const hojeStr = hoje.toISOString().split('T')[0]
  const limiteStr = limite.toISOString().split('T')[0]

  // Busca prazos pendentes que vencem entre hoje e N dias
  const { data: prazos, error } = await supabase
    .from('prazos')
    .select(`
      id, descricao, data_vencimento, escritorio_id,
      processos(numero_cnj)
    `)
    .eq('concluido', false)
    .gte('data_vencimento', hojeStr)
    .lte('data_vencimento', limiteStr)

  if (error) {
    console.error('[Notificações] Erro ao buscar prazos:', error)
    return Response.json({ erro: 'Erro ao buscar prazos' }, { status: 500 })
  }

  if (!prazos?.length) {
    return Response.json({ mensagem: 'Nenhum prazo para notificar', notificados: 0 })
  }

  // Agrupa por escritório para buscar membros uma vez por escritório
  const escritorioIds = [...new Set(prazos.map(p => p.escritorio_id))]

  const { data: membros } = await supabase
    .from('membros_escritorio')
    .select('escritorio_id, nome, email, telefone')
    .in('escritorio_id', escritorioIds)
    .in('cargo', ['socio', 'admin', 'advogado'])

  const membrosPorEscritorio = new Map<string, typeof membros>()
  for (const m of membros ?? []) {
    if (!membrosPorEscritorio.has(m.escritorio_id)) {
      membrosPorEscritorio.set(m.escritorio_id, [])
    }
    membrosPorEscritorio.get(m.escritorio_id)!.push(m)
  }

  let notificados = 0

  for (const prazo of prazos) {
    const processo = prazo.processos as any
    const venc = new Date(prazo.data_vencimento + 'T12:00:00')
    const diasRestantes = Math.floor((venc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
    const membrosDoEscritorio = membrosPorEscritorio.get(prazo.escritorio_id) ?? []

    for (const membro of membrosDoEscritorio) {
      if (membro.email) {
        await emailNovoPrazo({
          emailAdvogado: membro.email,
          nomeAdvogado: membro.nome,
          numeroCnj: processo?.numero_cnj ?? 'N/A',
          descricao: prazo.descricao,
          dataVencimento: prazo.data_vencimento,
          diasRestantes,
        }).catch(() => {})
        notificados++
      }

      if (membro.telefone) {
        await whatsappLembretePrazo({
          telefoneAdvogado: membro.telefone,
          numeroCnj: processo?.numero_cnj ?? 'N/A',
          descricao: prazo.descricao,
          dataVencimento: prazo.data_vencimento,
        }).catch(() => {})
      }
    }
  }

  return Response.json({
    mensagem: `Notificações enviadas com sucesso`,
    prazosEncontrados: prazos.length,
    notificados,
    periodo: { de: hojeStr, ate: limiteStr },
  })
}

// GET — usado por Vercel Cron (que envia GET por padrão)
export async function GET(req: Request) {
  return POST(req)
}
