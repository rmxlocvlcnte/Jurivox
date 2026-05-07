// Endpoint SQA — métricas de qualidade para o administrador da plataforma
// Acesso restrito a usuários autenticados (Clerk). Em produção, adicione verificação
// de userId específico do proprietário para restringir ao super-admin.
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import {
  analisarPareto,
  calcularConfiabilidade,
  obterMetricasQualidade,
  obterMatrizRiscos,
  CATEGORIAS_ERRO,
} from '@/lib/sqa'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 })
  }

  const searchParams = req.nextUrl.searchParams
  const periodo = Math.max(1, Math.min(365, parseInt(searchParams.get('periodo') ?? '30', 10)))

  const [pareto, confiabilidade, qualidade, riscos] = await Promise.all([
    analisarPareto(periodo),
    calcularConfiabilidade(periodo),
    obterMetricasQualidade(),
    obterMatrizRiscos(true),
  ])

  const supabase = createAdminClient()

  const [
    { data: revisoes },
    { data: tendencia },
    { data: incidentesAbertos },
    { data: errosRecentes },
    { data: conhecimentos },
    { data: partesInteressadas },
  ] = await Promise.all([
    supabase
      .from('sqa_revisoes')
      .select('*')
      .order('revisado_em', { ascending: false })
      .limit(10),
    supabase
      .from('sqa_metricas_diarias')
      .select('*')
      .order('data', { ascending: true })
      .limit(30),
    supabase
      .from('sqa_incidentes')
      .select('*')
      .eq('resolvido', false)
      .order('inicio', { ascending: false }),
    supabase
      .from('sqa_erros')
      .select('id, categoria, gravidade, descricao, origem, status, registrado_em')
      .in('status', ['aberto', 'em_analise'])
      .order('registrado_em', { ascending: false })
      .limit(20),
    supabase
      .from('sqa_conhecimentos')
      .select('id, titulo, tipo, responsavel, valido_ate, ativo')
      .eq('ativo', true)
      .order('criado_em', { ascending: false })
      .limit(20),
    supabase
      .from('sqa_partes_interessadas')
      .select('id, nome, tipo, relevancia, ativo')
      .eq('ativo', true)
      .order('relevancia', { ascending: false }),
  ])

  // Resumo de riscos por nível (ISO 9001:2015 — Cláusula 6.1.2)
  const resumo_riscos = {
    total: riscos.length,
    altos: riscos.filter(r => r.nivel_risco === 'alto').length,
    medios: riscos.filter(r => r.nivel_risco === 'medio').length,
    baixos: riscos.filter(r => r.nivel_risco === 'baixo').length,
  }

  return NextResponse.json({
    gerado_em: new Date().toISOString(),
    periodo_dias: periodo,
    norma: 'ISO 9001:2015 + Pressman Cap.16 + IEEE 730',
    categorias_referencia: CATEGORIAS_ERRO,
    confiabilidade,
    qualidade,
    pareto,
    // ISO 9001:2015 — Cláusula 6: Pensamento baseado em risco
    riscos,
    resumo_riscos,
    // ISO 9001:2015 — Cláusula 7.1.6: Gestão do conhecimento
    conhecimentos: conhecimentos ?? [],
    // ISO 9001:2015 — Cláusula 4.2: Partes interessadas
    partes_interessadas: partesInteressadas ?? [],
    // Dados históricos e auditoria
    revisoes: revisoes ?? [],
    tendencia: tendencia ?? [],
    incidentes_abertos: incidentesAbertos ?? [],
    erros_recentes: errosRecentes ?? [],
  })
}
