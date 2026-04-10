// ─────────────────────────────────────────────────────────────────────────────
// Permissões e cargos da plataforma
// ─────────────────────────────────────────────────────────────────────────────

export const CARGOS = ['socio', 'admin', 'advogado', 'estagiario'] as const
export type Cargo = typeof CARGOS[number]

// Grupos pré-definidos
export const CARGOS_FINANCEIRO = ['admin', 'socio'] as const
export const CARGOS_OPERACIONAIS = ['admin', 'socio', 'advogado'] as const
export const CARGOS_TODOS = CARGOS

// ─── Permissões por módulo ────────────────────────────────────────────────────
// Define quais cargos podem VER e quais podem EDITAR cada módulo.
// Use `exigirAcessoModulo` nas Server Actions para proteger operações.

export const PERMISSOES_MODULO = {
  // Quem pode acessar cada área
  financeiro:      { ver: ['socio', 'admin'] as string[],                   editar: ['socio', 'admin'] as string[] },
  honorarios:      { ver: ['socio', 'admin'] as string[],                   editar: ['socio', 'admin'] as string[] },
  relatorios:      { ver: ['socio', 'admin'] as string[],                   editar: ['socio', 'admin'] as string[] },
  equipe:          { ver: ['socio', 'admin'] as string[],                   editar: ['socio', 'admin'] as string[] },
  configuracoes:   { ver: ['socio', 'admin'] as string[],                   editar: ['socio'] as string[] },
  backup:          { ver: ['socio', 'admin'] as string[],                   editar: ['socio', 'admin'] as string[] },
  seguranca:       { ver: ['socio', 'admin'] as string[],                   editar: ['socio', 'admin'] as string[] },
  processos:       { ver: ['socio', 'admin', 'advogado', 'estagiario'] as string[], editar: ['socio', 'admin', 'advogado'] as string[] },
  clientes:        { ver: ['socio', 'admin', 'advogado', 'estagiario'] as string[], editar: ['socio', 'admin', 'advogado'] as string[] },
  prazos:          { ver: ['socio', 'admin', 'advogado', 'estagiario'] as string[], editar: ['socio', 'admin', 'advogado'] as string[] },
  agenda:          { ver: ['socio', 'admin', 'advogado', 'estagiario'] as string[], editar: ['socio', 'admin', 'advogado'] as string[] },
  templates:       { ver: ['socio', 'admin', 'advogado', 'estagiario'] as string[], editar: ['socio', 'admin', 'advogado'] as string[] },
  timesheet:       { ver: ['socio', 'admin', 'advogado', 'estagiario'] as string[], editar: ['socio', 'admin', 'advogado', 'estagiario'] as string[] },
  ia:              { ver: ['socio', 'admin', 'advogado'] as string[],        editar: ['socio', 'admin', 'advogado'] as string[] },
  analytics:       { ver: ['socio', 'admin'] as string[],                   editar: [] as string[] },
  monitoramento:   { ver: ['socio', 'admin', 'advogado'] as string[],       editar: ['socio', 'admin'] as string[] },
  icp_brasil:      { ver: ['socio', 'admin', 'advogado'] as string[],       editar: ['socio', 'admin', 'advogado'] as string[] },
} as const

export type Modulo = keyof typeof PERMISSOES_MODULO

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Verifica se um cargo está na lista de permitidos. Retorna { erro } ou null. */
export function exigirCargo(
  cargo: string | null,
  cargosPermitidos: readonly string[],
  mensagem = 'Sem permissão para esta ação.'
) {
  if (!cargo || !cargosPermitidos.includes(cargo)) {
    return { erro: mensagem }
  }
  return null
}

/** Verifica acesso de leitura a um módulo. */
export function podeVer(cargo: string | null, modulo: Modulo): boolean {
  if (!cargo) return false
  return PERMISSOES_MODULO[modulo].ver.includes(cargo)
}

/** Verifica acesso de edição a um módulo. */
export function podeEditar(cargo: string | null, modulo: Modulo): boolean {
  if (!cargo) return false
  return PERMISSOES_MODULO[modulo].editar.includes(cargo)
}

/** Exige acesso de leitura. Retorna { erro } ou null. */
export function exigirAcessoModulo(
  cargo: string | null,
  modulo: Modulo,
  operacao: 'ver' | 'editar' = 'editar'
) {
  const permitido = operacao === 'ver' ? podeVer(cargo, modulo) : podeEditar(cargo, modulo)
  if (!permitido) {
    return { erro: `Sem permissão para ${operacao === 'ver' ? 'acessar' : 'editar'} o módulo ${modulo}.` }
  }
  return null
}
