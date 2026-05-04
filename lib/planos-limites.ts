import { PLANOS } from '@/lib/stripe'

type Recurso = 'clientes' | 'processos' | 'membros'

const TABELA_POR_RECURSO: Record<Recurso, string> = {
  clientes: 'clientes',
  processos: 'processos',
  membros: 'membros_escritorio',
}

const CAMPO_LIMITE_POR_RECURSO: Record<Recurso, 'limite_clientes' | 'limite_processos' | 'limite_membros'> = {
  clientes: 'limite_clientes',
  processos: 'limite_processos',
  membros: 'limite_membros',
}

const NOME_RECURSO: Record<Recurso, string> = {
  clientes: 'clientes',
  processos: 'processos ativos',
  membros: 'membros da equipe',
}

function limitePadrao(planoId: string | null | undefined, recurso: Recurso): number {
  const plano = PLANOS[(planoId ?? 'starter') as keyof typeof PLANOS]
  // Fallback conservador quando o plano não é reconhecido
  if (!plano) return recurso === 'membros' ? 2 : recurso === 'processos' ? 50 : 150
  // Lê diretamente do objeto PLANOS — única fonte de verdade para limites
  return plano.limites[recurso]
}

function nomePlano(planoId: string | null | undefined): string {
  const plano = PLANOS[(planoId ?? 'starter') as keyof typeof PLANOS]
  return plano?.nome ?? 'Starter'
}

export async function obterInfoLimitePlano(params: {
  escritorioId: string
  recurso: Recurso
  supabase: any
}) {
  const { escritorioId, recurso, supabase } = params
  const campoLimite = CAMPO_LIMITE_POR_RECURSO[recurso]
  const tabela = TABELA_POR_RECURSO[recurso]

  const { data: assinatura } = await supabase
    .from('assinaturas_escritorio')
    .select(`
      plano_id,
      planos:plano_id (
        limite_clientes,
        limite_processos,
        limite_membros
      )
    `)
    .eq('escritorio_id', escritorioId)
    .maybeSingle()

  const planoRef = assinatura?.planos as null | {
    limite_clientes?: number
    limite_processos?: number
    limite_membros?: number
  }

  const limite = Number(planoRef?.[campoLimite] ?? limitePadrao(assinatura?.plano_id, recurso))

  const { count } = await supabase
    .from(tabela)
    .select('id', { count: 'exact', head: true })
    .eq('escritorio_id', escritorioId)

  return {
    recurso,
    planoId: assinatura?.plano_id ?? 'starter',
    planoNome: nomePlano(assinatura?.plano_id),
    limite,
    usado: count ?? 0,
  }
}

export async function verificarLimitePlano(params: {
  escritorioId: string
  recurso: Recurso
  supabase: any
  incremento?: number
  adicionalUsado?: number
}) {
  const info = await obterInfoLimitePlano({
    escritorioId: params.escritorioId,
    recurso: params.recurso,
    supabase: params.supabase,
  })

  const incremento = params.incremento ?? 1
  const adicionalUsado = params.adicionalUsado ?? 0

  // limite <= 0 representa ilimitado (ex.: enterprise)
  if (info.limite <= 0) return null

  const totalProjetado = info.usado + adicionalUsado + incremento
  if (totalProjetado <= info.limite) return null

  const faltam = Math.max(0, info.limite - (info.usado + adicionalUsado))
  return {
    erro: `Limite do plano ${info.planoNome} atingido para ${NOME_RECURSO[params.recurso]}. Disponivel agora: ${faltam}.`,
    codigo: 'limite_plano',
    limite: info.limite,
    usado: info.usado + adicionalUsado,
    recurso: params.recurso,
  }
}
