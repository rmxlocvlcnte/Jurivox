// ═══════════════════════════════════════════════════════════════════════════
// lib/sqa.ts — Garantia da Qualidade de Software (SQA)
// Implementa Capítulo 16 (Pressman) + ISO 9001:2015 + IEEE 730 + Six Sigma
//
// ISO 9001:2015 — High Level Structure (Annex SL):
//   Cláusula 4: Contexto da organização (partes interessadas)
//   Cláusula 6: Planejamento (riscos e oportunidades)
//   Cláusula 7.1.6: Gestão do conhecimento organizacional
//   Cláusula 9: Avaliação de desempenho (métricas e auditoria)
//   Cláusula 10: Melhoria contínua (não conformidades, ações corretivas)
// ═══════════════════════════════════════════════════════════════════════════

import { createAdminClient } from '@/lib/supabase/admin'

// ── Categorias de erro (Figura 16.2 — Pressman) ───────────────────────────
export const CATEGORIAS_ERRO = {
  IES: 'Especificações incompletas ou errôneas',
  MCC: 'Má interpretação da comunicação do cliente',
  IDS: 'Desvio intencional das especificações',
  VPS: 'Violação dos padrões de programação',
  EDR: 'Erro na representação de dados',
  ICI: 'Interface inconsistente de componentes',
  EDL: 'Erro na lógica de projeto',
  IET: 'Testes incompletos ou errôneos',
  IID: 'Documentação imprecisa ou incompleta',
  PLT: 'Erro na tradução do projeto para código',
  HCI: 'Interface homem-máquina ambígua ou inconsistente',
  MIS: 'Outros (miscellaneous)',
} as const

export type CategoriaErro     = keyof typeof CATEGORIAS_ERRO
export type GravidadeErro     = 'grave' | 'moderado' | 'secundario'
export type StatusErro        = 'aberto' | 'em_analise' | 'corrigido' | 'verificado' | 'fechado'
export type TipoIncidente     = 'downtime' | 'degraded' | 'erro_critico' | 'lentidao'
export type ImpactoIncidente  = 'critico' | 'alto' | 'medio' | 'baixo'
export type TipoRevisao       = 'codigo' | 'arquitetura' | 'requisitos' | 'seguranca' | 'desempenho' | 'banco_dados'
export type ResultadoRevisao  = 'aprovado' | 'aprovado_com_ressalvas' | 'reprovado'

// ── Tipos ISO 9001:2015 — Gestão de Riscos (Cláusula 6.1.2) ──────────────
export type ProbabilidadeRisco = 'alta' | 'media' | 'baixa'
export type ImpactoRisco       = 'alto' | 'medio' | 'baixo'
export type TipoRisco          = 'tecnico' | 'operacional' | 'seguranca' | 'conformidade' | 'negocio'
export type TratamentoRisco    = 'aceitar' | 'mitigar' | 'transferir' | 'evitar'
export type StatusRisco        = 'identificado' | 'em_tratamento' | 'monitorado' | 'fechado'
export type NivelRisco         = 'alto' | 'medio' | 'baixo'
export type TipoPartesInteressadas = 'cliente' | 'fornecedor' | 'regulador' | 'interno' | 'parceiro'
export type TipoConhecimento   = 'processo' | 'decisao' | 'licao_aprendida' | 'padrao' | 'documentacao' | 'arquitetura'

// Matriz de risco ISO 9001:2015: probabilidade × impacto (escala 1–9)
const PROB_SCORE: Record<ProbabilidadeRisco, number> = { alta: 3, media: 2, baixa: 1 }
const IMP_SCORE:  Record<ImpactoRisco, number>       = { alto: 3, medio: 2, baixo: 1 }

export function calcularPontuacaoRisco(prob: ProbabilidadeRisco, imp: ImpactoRisco): number {
  return PROB_SCORE[prob] * IMP_SCORE[imp]
}

export function classificarNivelRisco(pontuacao: number): NivelRisco {
  if (pontuacao >= 7) return 'alto'
  if (pontuacao >= 4) return 'medio'
  return 'baixo'
}

// ── Registrar defeito (Seção 16.5 — coleta e análise de erros) ───────────
export async function registrarDefeitoSQA(params: {
  categoria: CategoriaErro
  gravidade: GravidadeErro
  descricao: string
  origem?: string
  metadata?: Record<string, unknown>
}): Promise<string | null> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('sqa_erros')
      .insert({
        categoria: params.categoria,
        gravidade: params.gravidade,
        descricao: params.descricao,
        origem: params.origem ?? null,
        metadata: params.metadata ?? {},
      })
      .select('id')
      .single()
    return data?.id ?? null
  } catch {
    return null
  }
}

// ── Resolver defeito ──────────────────────────────────────────────────────
export async function resolverDefeitoSQA(id: string): Promise<boolean> {
  try {
    const supabase = createAdminClient()
    const { error } = await supabase
      .from('sqa_erros')
      .update({ status: 'corrigido', resolvido_em: new Date().toISOString() })
      .eq('id', id)
    return !error
  } catch {
    return false
  }
}

// ── Registrar incidente (para cálculo MTBF — Seção 16.6) ─────────────────
export async function abrirIncidente(params: {
  tipo: TipoIncidente
  descricao?: string
  impacto?: ImpactoIncidente
  metadata?: Record<string, unknown>
}): Promise<string | null> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('sqa_incidentes')
      .insert({
        tipo: params.tipo,
        descricao: params.descricao ?? null,
        impacto: params.impacto ?? 'baixo',
        metadata: params.metadata ?? {},
      })
      .select('id')
      .single()
    return data?.id ?? null
  } catch {
    return null
  }
}

// ── Fechar incidente ──────────────────────────────────────────────────────
export async function fecharIncidente(id: string): Promise<boolean> {
  try {
    const supabase = createAdminClient()
    const { error } = await supabase
      .from('sqa_incidentes')
      .update({ fim: new Date().toISOString(), resolvido: true })
      .eq('id', id)
    return !error
  } catch {
    return false
  }
}

// ── Registrar revisão técnica (Capítulo 15 — Pressman) ───────────────────
export async function registrarRevisaoSQA(params: {
  tipo: TipoRevisao
  descricao: string
  resultado: ResultadoRevisao
  errosEncontrados?: number
  naoConformidades?: string[]
  acoesCorretivas?: string[]
}): Promise<string | null> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('sqa_revisoes')
      .insert({
        tipo: params.tipo,
        descricao: params.descricao,
        resultado: params.resultado,
        erros_encontrados: params.errosEncontrados ?? 0,
        nao_conformidades: params.naoConformidades ?? [],
        acoes_corretivas: params.acoesCorretivas ?? [],
      })
      .select('id')
      .single()
    return data?.id ?? null
  } catch {
    return null
  }
}

// ── Cláusula 6.1.2 — Registrar risco (ISO 9001:2015) ─────────────────────
export async function registrarRisco(params: {
  descricao: string
  tipo: TipoRisco
  probabilidade: ProbabilidadeRisco
  impacto: ImpactoRisco
  tratamento?: TratamentoRisco
  acoes?: string[]
  proprietario?: string
  prazo?: string
}): Promise<string | null> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('sqa_riscos')
      .insert({
        descricao: params.descricao,
        tipo: params.tipo,
        probabilidade: params.probabilidade,
        impacto: params.impacto,
        tratamento: params.tratamento ?? 'mitigar',
        acoes: params.acoes ?? [],
        proprietario: params.proprietario ?? null,
        prazo: params.prazo ?? null,
      })
      .select('id')
      .single()
    return data?.id ?? null
  } catch {
    return null
  }
}

// ── Cláusula 6.1.2 — Obter matriz de riscos (ISO 9001:2015) ──────────────
export type EntradaMatrizRisco = {
  id: string
  descricao: string
  tipo: TipoRisco
  probabilidade: ProbabilidadeRisco
  impacto: ImpactoRisco
  pontuacao: number
  nivel_risco: NivelRisco
  tratamento: TratamentoRisco
  status: StatusRisco
  proprietario: string | null
  prazo: string | null
}

export async function obterMatrizRiscos(apenasAbertos = true): Promise<EntradaMatrizRisco[]> {
  try {
    const supabase = createAdminClient()
    let query = supabase
      .from('sqa_riscos')
      .select('id,descricao,tipo,probabilidade,impacto,pontuacao,nivel_risco,tratamento,status,proprietario,prazo')
      .order('pontuacao', { ascending: false })

    if (apenasAbertos) {
      query = query.not('status', 'eq', 'fechado')
    }

    const { data } = await query
    return (data ?? []) as EntradaMatrizRisco[]
  } catch {
    return []
  }
}

// ── Cláusula 4.2 — Registrar parte interessada (ISO 9001:2015) ───────────
export async function registrarParteInteressada(params: {
  nome: string
  tipo: TipoPartesInteressadas
  necessidades?: string[]
  expectativas?: string[]
  relevancia?: 'alta' | 'media' | 'baixa'
}): Promise<string | null> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('sqa_partes_interessadas')
      .insert({
        nome: params.nome,
        tipo: params.tipo,
        necessidades: params.necessidades ?? [],
        expectativas: params.expectativas ?? [],
        relevancia: params.relevancia ?? 'media',
      })
      .select('id')
      .single()
    return data?.id ?? null
  } catch {
    return null
  }
}

// ── Cláusula 7.1.6 — Registrar conhecimento organizacional (ISO 9001:2015)
export async function registrarConhecimento(params: {
  titulo: string
  tipo: TipoConhecimento
  descricao: string
  responsavel?: string
  artefatoUrl?: string
  validoAte?: string
}): Promise<string | null> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('sqa_conhecimentos')
      .insert({
        titulo: params.titulo,
        tipo: params.tipo,
        descricao: params.descricao,
        responsavel: params.responsavel ?? null,
        artefato_url: params.artefatoUrl ?? null,
        valido_ate: params.validoAte ?? null,
      })
      .select('id')
      .single()
    return data?.id ?? null
  } catch {
    return null
  }
}

// ── Análise de Pareto (Seção 16.5 — 80% dos defeitos em 20% das causas) ──
export type EntradaPareto = {
  categoria: CategoriaErro
  descricao: string
  total: number
  graves: number
  moderados: number
  secundarios: number
  percentual: number
  percentualAcumulado: number
  vitais: boolean  // pertence às "poucas causas vitais" (top 20%)
}

export async function analisarPareto(diasRetroativos = 90): Promise<EntradaPareto[]> {
  try {
    const supabase = createAdminClient()
    const desde = new Date(Date.now() - diasRetroativos * 86_400_000).toISOString()

    const { data } = await supabase
      .from('sqa_erros')
      .select('categoria, gravidade')
      .gte('registrado_em', desde)

    if (!data || data.length === 0) return []

    const contagens = new Map<string, { total: number; graves: number; moderados: number; secundarios: number }>()
    for (const erro of data) {
      const cat = erro.categoria as string
      const atual = contagens.get(cat) ?? { total: 0, graves: 0, moderados: 0, secundarios: 0 }
      atual.total++
      if (erro.gravidade === 'grave') atual.graves++
      else if (erro.gravidade === 'moderado') atual.moderados++
      else atual.secundarios++
      contagens.set(cat, atual)
    }

    const totalGeral = data.length
    const limiar80 = totalGeral * 0.8

    const ordenado = Array.from(contagens.entries())
      .sort((a, b) => b[1].total - a[1].total)

    let acumulado = 0
    return ordenado.map(([cat, counts]) => {
      const antesDeAdicionar = acumulado
      acumulado += counts.total
      const percentual = (counts.total / totalGeral) * 100
      const percentualAcumulado = (acumulado / totalGeral) * 100
      return {
        categoria: cat as CategoriaErro,
        descricao: CATEGORIAS_ERRO[cat as CategoriaErro] ?? cat,
        ...counts,
        percentual: Math.round(percentual * 10) / 10,
        percentualAcumulado: Math.round(percentualAcumulado * 10) / 10,
        vitais: antesDeAdicionar < limiar80,
      }
    })
  } catch {
    return []
  }
}

// ── Métricas de confiabilidade (Seção 16.6) ──────────────────────────────
// MTBF = MTTF + MTTR
// MTTF = Mean Time To Failure
// MTTR = Mean Time To Repair
// Disponibilidade = MTTF / (MTTF + MTTR) × 100%

export type MetricasConfiabilidade = {
  mtbf_horas: number
  mttf_horas: number
  mttr_horas: number
  disponibilidade_percentual: number
  total_incidentes: number
  periodo_dias: number
}

export async function calcularConfiabilidade(diasRetroativos = 30): Promise<MetricasConfiabilidade> {
  const vazio: MetricasConfiabilidade = {
    mtbf_horas: 0, mttf_horas: 0, mttr_horas: 0,
    disponibilidade_percentual: 100,
    total_incidentes: 0,
    periodo_dias: diasRetroativos,
  }

  try {
    const supabase = createAdminClient()
    const desde = new Date(Date.now() - diasRetroativos * 86_400_000).toISOString()

    const { data: incidentes } = await supabase
      .from('sqa_incidentes')
      .select('inicio, fim, duracao_segundos, resolvido')
      .gte('inicio', desde)
      .order('inicio', { ascending: true })

    if (!incidentes || incidentes.length === 0) {
      return { ...vazio, disponibilidade_percentual: 100 }
    }

    const resolvidos = incidentes.filter(i => i.resolvido && i.duracao_segundos != null)
    const totalIncidentes = incidentes.length
    const periodoSegundos = diasRetroativos * 86_400

    const totalReparo = resolvidos.reduce((sum, i) => sum + (i.duracao_segundos ?? 0), 0)
    const mttrSegundos = resolvidos.length > 0 ? totalReparo / resolvidos.length : 0

    const totalIndisponivel = incidentes.reduce((sum, i) => sum + (i.duracao_segundos ?? 0), 0)
    const tempoDisponivel = Math.max(0, periodoSegundos - totalIndisponivel)
    const mttfSegundos = totalIncidentes > 0 ? tempoDisponivel / totalIncidentes : periodoSegundos
    const mtbfSegundos = mttfSegundos + mttrSegundos
    const disponibilidade = mtbfSegundos > 0
      ? Math.min(100, (mttfSegundos / mtbfSegundos) * 100)
      : 100

    return {
      mtbf_horas: Math.round((mtbfSegundos / 3600) * 100) / 100,
      mttf_horas: Math.round((mttfSegundos / 3600) * 100) / 100,
      mttr_horas: Math.round((mttrSegundos / 3600) * 100) / 100,
      disponibilidade_percentual: Math.round(disponibilidade * 100) / 100,
      total_incidentes: totalIncidentes,
      periodo_dias: diasRetroativos,
    }
  } catch {
    return vazio
  }
}

// ── Métricas de qualidade do código (Seção 16.3.2 — metas e métricas) ────
export type MetricasQualidade = {
  total_erros_abertos: number
  total_erros_graves: number
  taxa_resolucao_percentual: number
  tempo_medio_resolucao_horas: number
  densidade_defeitos: number
  cobertura_revisoes: number
}

export async function obterMetricasQualidade(): Promise<MetricasQualidade> {
  const vazio: MetricasQualidade = {
    total_erros_abertos: 0, total_erros_graves: 0,
    taxa_resolucao_percentual: 100, tempo_medio_resolucao_horas: 0,
    densidade_defeitos: 0, cobertura_revisoes: 0,
  }

  try {
    const supabase = createAdminClient()
    const desde30d = new Date(Date.now() - 30 * 86_400_000).toISOString()

    const [
      { data: abertos },
      { data: resolvidos30d },
      { data: revisoes30d },
    ] = await Promise.all([
      supabase.from('sqa_erros').select('gravidade').in('status', ['aberto', 'em_analise']),
      supabase.from('sqa_erros')
        .select('tempo_resolucao_horas')
        .in('status', ['corrigido', 'verificado', 'fechado'])
        .gte('resolvido_em', desde30d),
      supabase.from('sqa_revisoes')
        .select('id', { count: 'exact', head: true })
        .gte('revisado_em', desde30d),
    ])

    const totalAbertos = abertos?.length ?? 0
    const totalGraves = abertos?.filter(e => e.gravidade === 'grave').length ?? 0
    const resolvidosCount = resolvidos30d?.length ?? 0

    const tempoMedioResolucao = resolvidosCount > 0
      ? resolvidos30d!.reduce((sum, e) => sum + (Number(e.tempo_resolucao_horas) || 0), 0) / resolvidosCount
      : 0

    const taxaResolucao = (totalAbertos + resolvidosCount) > 0
      ? (resolvidosCount / (totalAbertos + resolvidosCount)) * 100
      : 100

    return {
      total_erros_abertos: totalAbertos,
      total_erros_graves: totalGraves,
      taxa_resolucao_percentual: Math.round(taxaResolucao * 10) / 10,
      tempo_medio_resolucao_horas: Math.round(tempoMedioResolucao * 100) / 100,
      densidade_defeitos: resolvidosCount,
      cobertura_revisoes: (revisoes30d as unknown as { count: number } | null)?.count ?? 0,
    }
  } catch {
    return vazio
  }
}

// ── Cláusula 9.1 — Consolidar métricas diárias (ISO 9001:2015) ───────────
export async function consolidarMetricasDiarias(): Promise<void> {
  try {
    const supabase = createAdminClient()
    const hoje = new Date().toISOString().split('T')[0]

    const [qualidade, confiabilidade] = await Promise.all([
      obterMetricasQualidade(),
      calcularConfiabilidade(1),
    ])

    // Riscos abertos (Cláusula 6.1.2 — ISO 9001:2015)
    const [
      { count: auditCount },
      { data: riscosAbertos },
    ] = await Promise.all([
      supabase
        .from('audit_logs')
        .select('id', { count: 'exact', head: true })
        .gte('criado_em', `${hoje}T00:00:00Z`),
      supabase
        .from('sqa_riscos')
        .select('nivel_risco')
        .not('status', 'eq', 'fechado'),
    ])

    const totalRiscosAbertos = riscosAbertos?.length ?? 0
    const riscosAltos = riscosAbertos?.filter(r => r.nivel_risco === 'alto').length ?? 0

    await supabase.from('sqa_metricas_diarias').upsert({
      data: hoje,
      total_erros: qualidade.total_erros_abertos,
      erros_graves: qualidade.total_erros_graves,
      disponibilidade_percentual: confiabilidade.disponibilidade_percentual,
      acoes_auditadas: auditCount ?? 0,
      incidentes_abertos: confiabilidade.total_incidentes,
      riscos_abertos: totalRiscosAbertos,
      riscos_altos: riscosAltos,
      atualizado_em: new Date().toISOString(),
    }, { onConflict: 'data' })
  } catch {
    // Silencioso — não bloqueia operação principal
  }
}
