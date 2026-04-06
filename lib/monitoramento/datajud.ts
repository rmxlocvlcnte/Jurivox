type Movimento = {
  descricao: string
  data: string
  tipo?: string
}

function normalizarMovimento(item: any): Movimento | null {
  const descricao = item?.descricao ?? item?.description ?? item?.texto ?? ''
  const data = item?.data ?? item?.data_movimentacao ?? item?.date ?? item?.dataHora ?? ''
  if (!descricao || !data) return null
  return {
    descricao: String(descricao),
    data: String(data),
    tipo: item?.tipo ?? item?.type ?? 'andamento',
  }
}

export async function buscarMovimentacoesDataJud(numeroCnj: string) {
  const baseUrl = process.env.DATAJUD_API_URL
  const apiKey = process.env.DATAJUD_API_KEY
  if (!baseUrl) return []

  const url = new URL(baseUrl)
  url.searchParams.set('cnj', numeroCnj)

  const res = await fetch(url.toString(), {
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`DataJud erro: ${res.status} ${text}`)
  }

  const json: any = await res.json()
  const lista = json?.movimentacoes ?? json?.movements ?? json?.data ?? []
  if (!Array.isArray(lista)) return []

  return lista.map(normalizarMovimento).filter(Boolean) as Movimento[]
}
