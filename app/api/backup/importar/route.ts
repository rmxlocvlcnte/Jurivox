import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'
import { exigirCargo } from '@/lib/permissoes'

const CARGOS_BACKUP = ['socio', 'admin']

// Mapeia cada tabela do backup para os campos que podem ser restaurados
// (exclui campos gerados pelo banco como criado_em se já vierem no backup)
const _TABELAS_RESTAURAVEIS: Record<string, string> = {
  clientes: 'escritorio_id',
  processos: 'escritorio_id',
  prazos: 'escritorio_id',
  contratos: 'escritorio_id',
  honorarios: 'escritorio_id',
  movimentacoes_financeiras: 'escritorio_id',
  agenda_eventos: 'escritorio_id',
  contas_receber: 'escritorio_id',
  timesheet_lancamentos: 'escritorio_id',
  templates_documento: 'escritorio_id',
}

export async function POST(req: NextRequest) {
  const { escritorioId, cargo, supabase } = await getAuthContext()

  if (!escritorioId || !supabase) {
    return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })
  }

  const perm = exigirCargo(cargo, CARGOS_BACKUP, 'Somente sócios e admins podem restaurar backup.')
  if (perm) return NextResponse.json(perm, { status: 403 })

  let backup: any
  try {
    backup = await req.json()
  } catch {
    return NextResponse.json({ erro: 'JSON inválido.' }, { status: 400 })
  }

  // Validação básica da estrutura do backup
  if (!backup?.dados || !backup?.versao) {
    return NextResponse.json({ erro: 'Arquivo de backup inválido ou corrompido.' }, { status: 400 })
  }

  // Segurança: garante que todos os dados pertencem ao escritório logado
  // Não permite restaurar dados de outro escritório
  if (backup.escritorio_id && backup.escritorio_id !== escritorioId) {
    return NextResponse.json({ erro: 'O backup pertence a outro escritório.' }, { status: 403 })
  }

  const resumo: Record<string, number> = {}
  const erros: string[] = []

  const mapeamento: Record<string, any[]> = {
    clientes: backup.dados.clientes ?? [],
    processos: backup.dados.processos ?? [],
    prazos: backup.dados.prazos ?? [],
    contratos: backup.dados.contratos ?? [],
    honorarios: backup.dados.honorarios ?? [],
    movimentacoes_financeiras: backup.dados.movimentacoes_financeiras ?? [],
    agenda_eventos: backup.dados.agenda_eventos ?? [],
    contas_receber: backup.dados.contas_receber ?? [],
    timesheet_lancamentos: backup.dados.timesheet_lancamentos ?? [],
    templates_documento: backup.dados.templates ?? [],
  }

  for (const [tabela, registros] of Object.entries(mapeamento)) {
    if (!registros.length) {
      resumo[tabela] = 0
      continue
    }

    // Força escritorio_id para o escritório atual (segurança)
    const dadosSeguros = registros.map((r: any) => ({
      ...r,
      escritorio_id: escritorioId,
    }))

    try {
      const { data, error } = await supabase
        .from(tabela)
        .upsert(dadosSeguros, { onConflict: 'id' })
        .select('id')

      if (error) {
        erros.push(`${tabela}: ${error.message}`)
        resumo[tabela] = 0
      } else {
        resumo[tabela] = data?.length ?? 0
      }
    } catch (e) {
      erros.push(`${tabela}: ${e instanceof Error ? e.message : 'erro desconhecido'}`)
      resumo[tabela] = 0
    }
  }

  const status = erros.length === 0 ? 200 : 207

  return NextResponse.json(
    { resumo, erros: erros.length > 0 ? erros : undefined },
    { status }
  )
}
