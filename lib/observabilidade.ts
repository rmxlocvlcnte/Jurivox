// ─────────────────────────────────────────────────────────────────────────────
// lib/observabilidade.ts — Logging estruturado + integração SQA
// Implementa coleta de erros/defeitos conforme Seção 16.5 (Pressman)
// Integra com ISO 9001:2015 Cláusula 10.2 (não-conformidades e ações corretivas)
// ─────────────────────────────────────────────────────────────────────────────

import { registrarDefeitoSQA, type CategoriaErro, type GravidadeErro } from '@/lib/sqa'

export type ObservabilidadeNivel = 'info' | 'warn' | 'error' | 'critico'

type Payload = {
  nivel: ObservabilidadeNivel
  origem: string
  mensagem: string
  contexto?: Record<string, unknown>
  // Campos SQA — quando informados, persiste na tabela sqa_erros para análise de Pareto
  categoriaSQA?: CategoriaErro
  gravidadeSQA?: GravidadeErro
}

export function registrarEvento({
  nivel,
  origem,
  mensagem,
  contexto = {},
  categoriaSQA,
  gravidadeSQA,
}: Payload) {
  const evento = {
    timestamp: new Date().toISOString(),
    nivel,
    origem,
    mensagem,
    contexto,
  }

  const linha = JSON.stringify(evento)

  if (nivel === 'critico' || nivel === 'error') {
    console.error(linha)
  } else if (nivel === 'warn') {
    console.warn(linha)
  } else {
    console.log(linha)
  }

  // Persiste no banco SQA para rastreabilidade e análise de Pareto (fire & forget)
  if (categoriaSQA && (nivel === 'error' || nivel === 'critico')) {
    const gravidade: GravidadeErro = nivel === 'critico'
      ? 'grave'
      : (gravidadeSQA ?? 'moderado')

    registrarDefeitoSQA({
      categoria: categoriaSQA,
      gravidade,
      descricao: mensagem,
      origem,
      metadata: contexto,
    }).catch(() => undefined)
  }
}
