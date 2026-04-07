// ─────────────────────────────────────────────────────────────────────────────
// LIMITES POR PLANO — Verificação no nível da aplicação
//
// Camadas de proteção:
//   1. Esta função (Server Action / Route Handler) — melhor UX, mensagem clara
//   2. Trigger PostgreSQL fn_verificar_limite_plano() — barreira final no banco
//
// Uso:
//   const limite = await verificarLimite(escritorioId, 'processos', supabase)
//   if (limite.atingido) return { erro: limite.mensagem }
// ─────────────────────────────────────────────────────────────────────────────

import type { SupabaseClient } from '@supabase/supabase-js'

export type EntidadeLimite = 'processos' | 'clientes' | 'membros' | 'templates'

export interface ResultadoLimite {
  atingido: boolean
  atual: number
  limite: number        // -1 = ilimitado
  plano: string
  mensagem?: string     // definida apenas quando atingido = true
}

// Nomes amigáveis para exibição
const NOMES: Record<EntidadeLimite, string> = {
  processos: 'processos ativos',
  clientes: 'clientes',
  membros: 'membros',
  templates: 'templates de documentos',
}

// Limites padrão caso não haja assinatura registrada (fallback = Starter)
const LIMITES_PADRAO: Record<EntidadeLimite, number> = {
  processos: 50,
  clientes: 150,
  membros: 2,
  templates: 5,
}

export async function verificarLimite(
  escritorioId: string,
  entidade: EntidadeLimite,
  supabase: SupabaseClient,
): Promise<ResultadoLimite> {
  // ── 1. Busca plano e limites da assinatura ativa ──────────────────────────
  const { data: assinatura } = await supabase
    .from('assinaturas_escritorio')
    .select(`
      plano_id,
      planos (
        nome,
        limite_processos,
        limite_clientes,
        limite_membros,
        limite_templates
      )
    `)
    .eq('escritorio_id', escritorioId)
    .in('status', ['active', 'trialing'])
    .order('criado_em', { ascending: false })
    .limit(1)
    .single()

  const plano = assinatura?.planos as {
    nome: string
    limite_processos: number
    limite_clientes: number
    limite_membros: number
    limite_templates: number
  } | null

  const planoNome = plano?.nome ?? 'Starter'

  // Mapeia entidade → coluna de limite
  const limiteMap: Record<EntidadeLimite, number> = {
    processos: plano?.limite_processos ?? LIMITES_PADRAO.processos,
    clientes:  plano?.limite_clientes  ?? LIMITES_PADRAO.clientes,
    membros:   plano?.limite_membros   ?? LIMITES_PADRAO.membros,
    templates: plano?.limite_templates ?? LIMITES_PADRAO.templates,
  }

  const limite = limiteMap[entidade]

  // ── 2. Ilimitado — retorna sem contar ─────────────────────────────────────
  if (limite === -1) {
    return { atingido: false, atual: 0, limite: -1, plano: planoNome }
  }

  // ── 3. Conta registros atuais ─────────────────────────────────────────────
  let query = supabase
    .from(entidade === 'templates' ? 'templates_documento' :
          entidade === 'membros'   ? 'membros_escritorio'  : entidade)
    .select('id', { count: 'exact', head: true })
    .eq('escritorio_id', escritorioId)

  // Processos arquivados não contam contra o limite
  if (entidade === 'processos') {
    query = query.neq('status', 'arquivado')
  }

  // Apenas membros ativos contam
  if (entidade === 'membros') {
    query = query.eq('ativo', true)
  }

  const { count } = await query
  const atual = count ?? 0

  // ── 4. Verifica e retorna resultado ───────────────────────────────────────
  const atingido = atual >= limite
  return {
    atingido,
    atual,
    limite,
    plano: planoNome,
    mensagem: atingido
      ? `Limite de ${limite} ${NOMES[entidade]} atingido no plano ${planoNome}. Faça upgrade em Configurações → Planos para continuar.`
      : undefined,
  }
}
