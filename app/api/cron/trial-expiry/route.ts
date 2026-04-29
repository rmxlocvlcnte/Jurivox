// -----------------------------------------------
// CRON: Trial expirando — notifica usuários cujo trial termina em 3 dias ou 1 dia
// Schedule: 0 9 * * *  (9h todos os dias)
// -----------------------------------------------
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { emailTrialExpirando } from '@/lib/notificacoes/email'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET

  if (!secret) {
    return NextResponse.json({ erro: 'CRON_SECRET nao configurado.' }, { status: 500 })
  }
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ erro: 'Nao autorizado.' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const agora = new Date()

  // Janelas de aviso: 3 dias e 1 dia antes do fim do trial
  const janelas = [
    { diasRestantes: 3, inicio: new Date(agora.getTime() + 3 * 24 * 60 * 60 * 1000), fim: new Date(agora.getTime() + 4 * 24 * 60 * 60 * 1000) },
    { diasRestantes: 1, inicio: new Date(agora.getTime() + 1 * 24 * 60 * 60 * 1000), fim: new Date(agora.getTime() + 2 * 24 * 60 * 60 * 1000) },
  ]

  let totalNotificados = 0

  for (const janela of janelas) {
    const inicioStr = janela.inicio.toISOString()
    const fimStr = janela.fim.toISOString()

    const { data: assinaturas } = await supabase
      .from('assinaturas_escritorio')
      .select('escritorio_id, plano_id, trial_termina_em')
      .eq('status', 'trialing')
      .gte('trial_termina_em', inicioStr)
      .lt('trial_termina_em', fimStr)

    for (const assinatura of assinaturas ?? []) {
      const [{ data: membros }, { data: escritorio }] = await Promise.all([
        supabase
          .from('membros_escritorio')
          .select('nome, email')
          .eq('escritorio_id', assinatura.escritorio_id)
          .in('cargo', ['socio', 'admin'])
          .eq('ativo', true),
        supabase
          .from('escritorios')
          .select('nome')
          .eq('id', assinatura.escritorio_id)
          .single(),
      ])

      for (const membro of membros ?? []) {
        if (!membro.email) continue
        await emailTrialExpirando({
          emailAdvogado: membro.email,
          nomeAdvogado: membro.nome,
          nomeEscritorio: escritorio?.nome ?? 'seu escritório',
          diasRestantes: janela.diasRestantes,
          planoAtual: assinatura.plano_id ?? 'Starter',
        })
        totalNotificados++
      }
    }
  }

  console.log(`[CRON trial-expiry] ${totalNotificados} notificações de trial enviadas`)

  return NextResponse.json({
    notificados: totalNotificados,
    executado_em: agora.toISOString(),
  })
}
