// Endpoint SQA — métricas de qualidade para o administrador da plataforma
// Acesso restrito a usuários autenticados (Clerk). Em produção, adicione verificação
// de userId específico do proprietário para restringir ao super-admin.
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import {
  analisarPareto,
  calcularConfiabilidade,
  obterMetricasQualidade,
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

  const [pareto, confiabilidade, qualidade] = await Promise.all([
    analisarPareto(periodo),
    calcularConfiabilidade(periodo),
    obterMetricasQualidade(),
  ])

  const supabase = createAdminClient()

  const [
    { data: revisoes },
    { data: tendencia },
    { data: incidentesAbertos },
    { data: errosRecentes },
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
  ])

  return NextResponse.json({
    gerado_em: new Date().toISOString(),
    periodo_dias: periodo,
    categorias_referencia: CATEGORIAS_ERRO,
    confiabilidade,
    qualidade,
    pareto,
    revisoes: revisoes ?? [],
    tendencia: tendencia ?? [],
    incidentes_abertos: incidentesAbertos ?? [],
    erros_recentes: errosRecentes ?? [],
  })
}
