// -----------------------------------------------
// CRON: Contas a receber — auto-marcar vencidas + notificar escritório
// Schedule: 0 8 * * 1-5  (8h dias úteis)
// -----------------------------------------------
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { emailContasVencidas } from '@/lib/notificacoes/email'

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
  const hoje = new Date().toISOString().split('T')[0]

  // 1. Auto-marcar como vencido todas as contas abertas com vencimento < hoje
  const { data: atualizadas, error: errUpdate } = await supabase
    .from('contas_receber')
    .update({ status: 'vencido', atualizado_em: new Date().toISOString() })
    .eq('status', 'aberto')
    .lt('data_vencimento', hoje)
    .select('id, escritorio_id, valor')

  if (errUpdate) {
    console.error('[CRON contas-receber] Erro ao marcar vencidas:', errUpdate)
    return NextResponse.json({ erro: 'Erro ao atualizar contas.' }, { status: 500 })
  }

  // 2. Contas que vencem HOJE (ainda abertas) para incluir no resumo
  const { data: vencendoHoje } = await supabase
    .from('contas_receber')
    .select('id, escritorio_id, valor')
    .eq('status', 'aberto')
    .eq('data_vencimento', hoje)

  // Agrupa tudo por escritório para montar um resumo por escritório
  const porEscritorio = new Map<string, { vencidas: number; valorVencido: number; vencendoHoje: number }>()

  for (const c of atualizadas ?? []) {
    const entry = porEscritorio.get(c.escritorio_id) ?? { vencidas: 0, valorVencido: 0, vencendoHoje: 0 }
    entry.vencidas++
    entry.valorVencido += c.valor ?? 0
    porEscritorio.set(c.escritorio_id, entry)
  }

  for (const c of vencendoHoje ?? []) {
    const entry = porEscritorio.get(c.escritorio_id) ?? { vencidas: 0, valorVencido: 0, vencendoHoje: 0 }
    entry.vencendoHoje++
    porEscritorio.set(c.escritorio_id, entry)
  }

  // 3. Notifica por e-mail os sócios/admins de cada escritório
  let escritoriosNotificados = 0

  for (const [escritorioId, stats] of porEscritorio.entries()) {
    if (stats.vencidas === 0 && stats.vencendoHoje === 0) continue

    const [{ data: membros }, { data: escritorio }] = await Promise.all([
      supabase
        .from('membros_escritorio')
        .select('nome, email')
        .eq('escritorio_id', escritorioId)
        .in('cargo', ['socio', 'admin'])
        .eq('ativo', true),
      supabase
        .from('escritorios')
        .select('nome')
        .eq('id', escritorioId)
        .single(),
    ])

    for (const membro of membros ?? []) {
      if (!membro.email) continue
      await emailContasVencidas({
        emailAdvogado: membro.email,
        nomeAdvogado: membro.nome,
        nomeEscritorio: escritorio?.nome ?? 'seu escritório',
        qtdVencidas: stats.vencidas,
        valorTotalVencido: stats.valorVencido,
        qtdVencendoHoje: stats.vencendoHoje,
      })
    }

    escritoriosNotificados++
  }

  console.log(`[CRON contas-receber] ${atualizadas?.length ?? 0} contas marcadas vencidas, ${escritoriosNotificados} escritórios notificados`)

  return NextResponse.json({
    contasMarcadasVencidas: atualizadas?.length ?? 0,
    escritoriosNotificados,
    data: hoje,
  })
}
