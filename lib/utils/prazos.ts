import { createAdminClient } from '@/lib/supabase/admin'

// Cache de feriados em memória (TTL: 1 hora)
let feriadosCache: Set<string> | null = null
let cacheCarregadoEm = 0
const CACHE_TTL = 60 * 60 * 1000 // 1 hora

async function carregarFeriados(): Promise<Set<string>> {
  const agora = Date.now()
  if (feriadosCache && agora - cacheCarregadoEm < CACHE_TTL) {
    return feriadosCache
  }

  try {
    const supabase = createAdminClient()
    // Só feriados nacionais — estaduais/municipais requerem UF/município do escritório
    const { data } = await supabase
      .from('feriados')
      .select('data')
      .eq('tipo', 'nacional')

    const set = new Set<string>((data ?? []).map((f: { data: string }) => f.data))
    feriadosCache = set
    cacheCarregadoEm = agora
    return set
  } catch {
    // Se falhar, retorna set vazio (degrada graciosamente — funciona sem feriados)
    return new Set()
  }
}

export async function calcularDataVencimentoAsync(
  dataInicio: string,
  quantidadeDias: number,
  diasUteis: boolean,
): Promise<string> {
  const feriados = diasUteis ? await carregarFeriados() : new Set<string>()
  return calcularDataVencimentoComFeriados(dataInicio, quantidadeDias, diasUteis, feriados)
}

export function calcularDataVencimentoComFeriados(
  dataInicio: string,
  quantidadeDias: number,
  diasUteis: boolean,
  feriados: Set<string> = new Set(),
): string {
  const base = new Date(`${dataInicio}T12:00:00`)
  let data = new Date(base)
  let contados = 0

  while (contados < quantidadeDias) {
    data.setDate(data.getDate() + 1)
    if (diasUteis) {
      const diaSemana = data.getDay()
      const dataStr = data.toISOString().split('T')[0]
      if (diaSemana !== 0 && diaSemana !== 6 && !feriados.has(dataStr)) {
        contados++
      }
    } else {
      contados++
    }
  }

  return data.toISOString().split('T')[0]
}

// Mantida para retrocompatibilidade — usa apenas fim-de-semana (sem feriados)
export function calcularDataVencimento(
  dataInicio: string,
  quantidadeDias: number,
  diasUteis: boolean,
): string {
  return calcularDataVencimentoComFeriados(dataInicio, quantidadeDias, diasUteis, new Set())
}

export function extrairPrazoDaDescricao(
  descricao: string,
): { quantidadeDias: number; diasUteis: boolean } | null {
  const texto = descricao.toLowerCase()
  const match = texto.match(/prazo\s*(de)?\s*(\d{1,3})\s*dias?(\s*uteis)?/)
  if (!match) return null

  const quantidadeDias = Number(match[2])
  if (!Number.isFinite(quantidadeDias) || quantidadeDias <= 0) return null

  const diasUteis = Boolean(match[3]) || texto.includes('dias uteis')
  return { quantidadeDias, diasUteis }
}
