// ─────────────────────────────────────────────────────────────────────
// BACKUP — Exportação completa dos dados do escritório em JSON
// GET /api/backup?formato=json|csv
// Autenticado via Clerk. Requer cargo: socio ou admin.
// ─────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'
import { exigirCargo } from '@/lib/permissoes'

const CARGOS_BACKUP = ['socio', 'admin']

export async function GET(req: NextRequest) {
  const { escritorioId, cargo, supabase, mfaObrigatorio } = await getAuthContext({ redirecionar2FA: false })

  if (mfaObrigatorio) {
    return NextResponse.json({ erro: '2FA obrigatório.' }, { status: 403 })
  }

  if (!escritorioId || !supabase) {
    return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })
  }

  const perm = exigirCargo(cargo, CARGOS_BACKUP, 'Somente sócios e admins podem fazer backup.')
  if (perm) return NextResponse.json(perm, { status: 403 })

  const formato = req.nextUrl.searchParams.get('formato') ?? 'json'

  // Busca todos os dados do escritório em paralelo
  const [
    { data: clientes },
    { data: processos },
    { data: movimentacoes },
    { data: prazos },
    { data: contratos },
    { data: honorarios },
    { data: pagamentos },
    { data: agenda },
    { data: contas },
    { data: timesheet },
    { data: templates },
    { data: documentos },
    { data: membros },
  ] = await Promise.all([
    supabase.from('clientes').select('*').eq('escritorio_id', escritorioId).order('nome'),
    supabase.from('processos').select('*').eq('escritorio_id', escritorioId).order('criado_em', { ascending: false }),
    supabase.from('movimentacoes').select('*').eq('processo_id.processos.escritorio_id', escritorioId).limit(5000),
    supabase.from('prazos').select('*').eq('escritorio_id', escritorioId).order('data_vencimento'),
    supabase.from('contratos').select('*').eq('escritorio_id', escritorioId).order('criado_em', { ascending: false }),
    supabase.from('honorarios').select('*').eq('escritorio_id', escritorioId).order('criado_em', { ascending: false }),
    supabase.from('pagamentos_honorarios').select('*').limit(5000),
    supabase.from('agenda_eventos').select('*').eq('escritorio_id', escritorioId).order('data_inicio'),
    supabase.from('contas_receber').select('*').eq('escritorio_id', escritorioId).order('criado_em', { ascending: false }),
    supabase.from('timesheet_lancamentos').select('*').eq('escritorio_id', escritorioId).order('data', { ascending: false }),
    supabase.from('templates_documento').select('id, nome, tipo, variaveis, criado_em, atualizado_em').eq('escritorio_id', escritorioId),
    supabase.from('movimentacoes_financeiras').select('*').eq('escritorio_id', escritorioId).order('data', { ascending: false }),
    supabase.from('membros_escritorio').select('id, nome, email, cargo, ativo, criado_em').eq('escritorio_id', escritorioId),
  ])

  const backup = {
    exportado_em: new Date().toISOString(),
    versao: '1.0',
    escritorio_id: escritorioId,
    resumo: {
      clientes: clientes?.length ?? 0,
      processos: processos?.length ?? 0,
      prazos: prazos?.length ?? 0,
      contratos: contratos?.length ?? 0,
      honorarios: honorarios?.length ?? 0,
      agenda: agenda?.length ?? 0,
      contas_receber: contas?.length ?? 0,
      timesheet: timesheet?.length ?? 0,
      templates: templates?.length ?? 0,
      membros: membros?.length ?? 0,
    },
    dados: {
      clientes: clientes ?? [],
      processos: processos ?? [],
      movimentacoes_processos: movimentacoes ?? [],
      prazos: prazos ?? [],
      contratos: contratos ?? [],
      honorarios: honorarios ?? [],
      pagamentos_honorarios: pagamentos ?? [],
      movimentacoes_financeiras: documentos ?? [],
      agenda_eventos: agenda ?? [],
      contas_receber: contas ?? [],
      timesheet_lancamentos: timesheet ?? [],
      templates: templates ?? [],
      membros: membros ?? [],
    },
  }

  const dataStr = new Date().toISOString().split('T')[0]
  const filename = `jurisflow-backup-${dataStr}.json`

  return new NextResponse(JSON.stringify(backup, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
