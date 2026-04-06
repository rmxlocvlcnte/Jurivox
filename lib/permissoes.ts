export const CARGOS_FINANCEIRO = ['admin', 'socio'] as const
export const CARGOS_OPERACIONAIS = ['admin', 'socio', 'advogado'] as const

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
