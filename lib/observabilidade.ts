export type ObservabilidadeNivel = 'info' | 'warn' | 'error'

type Payload = {
  nivel: ObservabilidadeNivel
  origem: string
  mensagem: string
  contexto?: Record<string, unknown>
}

export function registrarEvento({ nivel, origem, mensagem, contexto = {} }: Payload) {
  const evento = {
    timestamp: new Date().toISOString(),
    nivel,
    origem,
    mensagem,
    contexto,
  }

  const linha = JSON.stringify(evento)

  if (nivel === 'error') {
    console.error(linha)
    return
  }

  if (nivel === 'warn') {
    console.warn(linha)
    return
  }

  console.log(linha)
}

