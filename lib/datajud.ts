import { calcularDataVencimento, extrairPrazoDaDescricao } from '@/lib/utils/prazos'
import type { SupabaseClient } from '@supabase/supabase-js'

const DATAJUD_BASE = process.env.DATAJUD_API_URL ?? 'https://api-publica.datajud.cnj.jus.br'
const DATAJUD_KEY = process.env.DATAJUD_API_KEY ?? null

// Retry com backoff exponencial: tenta até `tentativas` vezes
async function comRetry<T>(
  fn: () => Promise<T>,
  tentativas = 3,
  delayMs = 500,
): Promise<T> {
  let ultimoErro: unknown
  for (let i = 0; i < tentativas; i++) {
    try {
      return await fn()
    } catch (err) {
      ultimoErro = err
      if (i < tentativas - 1) {
        await new Promise(r => setTimeout(r, delayMs * Math.pow(2, i)))
      }
    }
  }
  throw ultimoErro
}

const TRIBUNAL_MAP: Record<string, string> = {
  '8.01': 'tjac', '8.02': 'tjal', '8.03': 'tjap', '8.04': 'tjam',
  '8.05': 'tjba', '8.06': 'tjce', '8.07': 'tjdf', '8.08': 'tjes',
  '8.09': 'tjgo', '8.10': 'tjma', '8.11': 'tjmt', '8.12': 'tjms',
  '8.13': 'tjmg', '8.14': 'tjpa', '8.15': 'tjpb', '8.16': 'tjpr',
  '8.17': 'tjpe', '8.18': 'tjpi', '8.19': 'tjrj', '8.20': 'tjrn',
  '8.21': 'tjrs', '8.22': 'tjro', '8.23': 'tjrr', '8.24': 'tjsc',
  '8.25': 'tjsp', '8.26': 'tjse', '8.27': 'tjto',
  '4.01': 'trf1', '4.02': 'trf2', '4.03': 'trf3',
  '4.04': 'trf4', '4.05': 'trf5', '4.06': 'trf6',
  '5.01': 'trt1', '5.02': 'trt2', '5.03': 'trt3',
  '5.04': 'trt4', '5.05': 'trt5', '5.06': 'trt6',
  '5.07': 'trt7', '5.08': 'trt8', '5.09': 'trt9',
  '5.10': 'trt10', '5.11': 'trt11', '5.12': 'trt12',
  '5.13': 'trt13', '5.14': 'trt14', '5.15': 'trt15',
  '5.16': 'trt16', '5.17': 'trt17', '5.18': 'trt18',
  '5.19': 'trt19', '5.20': 'trt20', '5.21': 'trt21',
  '5.22': 'trt22', '5.23': 'trt23', '5.24': 'trt24',
  '2.0000': 'stj', '1.0000': 'stf', '6.0000': 'tst', '3.0000': 'tse',
}

function extrairTribunalDatajud(numeroCnj: string): string | null {
  const match = numeroCnj.replace(/\s/g, '').match(/\d{7}-\d{2}\.\d{4}\.(\d)\.(\d{2,4})\.\d{4}/)
  if (!match) return null
  return TRIBUNAL_MAP[`${match[1]}.${match[2]}`] ?? null
}

function classificarTipoMovimentacao(descricao: string): 'andamento' | 'audiencia' | 'sentenca' | 'despacho' | 'prazo' | 'outro' {
  const texto = descricao.toLowerCase()
  if (texto.includes('audien')) return 'audiencia'
  if (texto.includes('sentenc')) return 'sentenca'
  if (texto.includes('despach')) return 'despacho'
  if (texto.includes('prazo')) return 'prazo'
  if (texto.includes('concluso') || texto.includes('juntada') || texto.includes('certidao')) return 'andamento'
  return 'outro'
}

async function criarPrazoAutomatico(params: {
  supabaseAdmin: SupabaseClient
  escritorioId: string
  processoId: string
  responsavelId?: string | null
  descricaoMov: string
  dataMovIso: string
}) {
  const extraido = extrairPrazoDaDescricao(params.descricaoMov)
  if (!extraido) return false

  const dataInicio = new Date(params.dataMovIso).toISOString().split('T')[0]
  const dataVencimento = calcularDataVencimento(dataInicio, extraido.quantidadeDias, extraido.diasUteis)
  const descricaoPrazo = `Prazo automatico (DataJud): ${extraido.quantidadeDias} dia(s)${extraido.diasUteis ? ' uteis' : ''} - ${params.descricaoMov.slice(0, 160)}`

  const { data: existente } = await params.supabaseAdmin
    .from('prazos')
    .select('id')
    .eq('escritorio_id', params.escritorioId)
    .eq('processo_id', params.processoId)
    .eq('descricao', descricaoPrazo)
    .eq('data_inicio', dataInicio)
    .maybeSingle()

  if (existente) return false

  const { error: erroPrazo } = await params.supabaseAdmin
    .from('prazos')
    .insert({
      escritorio_id: params.escritorioId,
      processo_id: params.processoId,
      descricao: descricaoPrazo,
      data_inicio: dataInicio,
      quantidade_dias: extraido.quantidadeDias,
      dias_uteis: extraido.diasUteis,
      data_vencimento: dataVencimento,
      responsavel_id: params.responsavelId ?? null,
    })

  if (erroPrazo) {
    console.error('[DataJud] erro ao criar prazo automatico:', erroPrazo)
    return false
  }

  const dataEvento = new Date(`${dataVencimento}T12:00:00`).toISOString()
  const tituloEvento = `Prazo automatico - ${extraido.quantidadeDias}d`

  const { data: eventoExistente } = await params.supabaseAdmin
    .from('agenda_eventos')
    .select('id')
    .eq('escritorio_id', params.escritorioId)
    .eq('processo_id', params.processoId)
    .eq('titulo', tituloEvento)
    .eq('data_inicio', dataEvento)
    .maybeSingle()

  if (!eventoExistente) {
    await params.supabaseAdmin.from('agenda_eventos').insert({
      escritorio_id: params.escritorioId,
      processo_id: params.processoId,
      responsavel_id: params.responsavelId ?? null,
      titulo: tituloEvento,
      descricao: descricaoPrazo,
      tipo: 'prazo',
      data_inicio: dataEvento,
      dia_todo: false,
    })
  }

  return true
}

export interface MovimentacaoDataJud {
  dataHora: string
  descricao: string
  codigo?: number
}

export interface ProcessoDataJud {
  numeroProcesso: string
  tribunal: string
  movimentos: MovimentacaoDataJud[]
  assunto?: string
  classe?: string
  dataAjuizamento?: string
}

export async function consultarProcesso(numeroCnj: string): Promise<ProcessoDataJud | null> {
  if (!DATAJUD_BASE || !DATAJUD_KEY) return null

  const indice = extrairTribunalDatajud(numeroCnj)
  if (!indice) return null

  const url = `${DATAJUD_BASE}/api_publica_${indice}/_search`
  const body = {
    query: {
      match: {
        numeroProcesso: numeroCnj
          .replace(/[^0-9]/g, '')
          .replace(/(\d{7})(\d{2})(\d{4})(\d)(\d{2,4})(\d{4})/, '$1-$2.$3.$4.$5.$6'),
      },
    },
    size: 1,
  }

  try {
    return await comRetry(async () => {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `APIKey ${DATAJUD_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000),
      })

      if (res.status === 429) {
        // Rate limit: aguarda 2s antes de retry
        await new Promise(r => setTimeout(r, 2000))
        throw new Error('rate_limit')
      }

      if (!res.ok) throw new Error(`http_${res.status}`)

      const json = await res.json()
      const hit = json?.hits?.hits?.[0]?._source
      if (!hit) return null

      return {
        numeroProcesso: hit.numeroProcesso ?? numeroCnj,
        tribunal: indice.toUpperCase(),
        dataAjuizamento: hit.dataAjuizamento,
        assunto: hit.assuntos?.[0]?.nome,
        classe: hit.classe?.nome,
        movimentos: (hit.movimentos ?? []).map((m: any) => ({
          dataHora: m.dataHora ?? m.data,
          descricao: m.nome ?? m.descricao ?? 'Movimentacao',
          codigo: m.codigo,
        })),
      } satisfies ProcessoDataJud
    }, 3, 800)
  } catch {
    return null
  }
}

export async function sincronizarProcesso(
  processoId: string,
  numeroCnj: string,
  escritorioId: string,
  supabaseAdmin: SupabaseClient,
): Promise<{ novas: number; prazosAutomaticos: number; erro?: string }> {
  const dados = await consultarProcesso(numeroCnj)

  if (!dados) {
    await supabaseAdmin.from('monitoramento_logs').insert({
      escritorio_id: escritorioId,
      processo_id: processoId,
      numero_cnj: numeroCnj,
      status: 'sem_dados',
    })
    return { novas: 0, prazosAutomaticos: 0, erro: 'Processo nao encontrado no DataJud.' }
  }

  const [{ data: existentes }, { data: processoMeta }] = await Promise.all([
    supabaseAdmin
      .from('movimentacoes')
      .select('descricao, data_movimentacao')
      .eq('processo_id', processoId)
      .eq('fonte', 'datajud'),
    supabaseAdmin
      .from('processos')
      .select('responsavel_id')
      .eq('id', processoId)
      .maybeSingle(),
  ])

  const existentesSet = new Set(
    (existentes ?? []).map((m: any) => `${m.descricao?.trim()}|${m.data_movimentacao?.split('T')[0]}`)
  )

  const novas = dados.movimentos
    .filter((m) => m.descricao && m.dataHora)
    .filter((m) => {
      const dataIso = new Date(m.dataHora).toISOString().split('T')[0]
      const key = `${m.descricao.trim()}|${dataIso}`
      return !existentesSet.has(key)
    })

  let prazosAutomaticos = 0

  if (novas.length > 0) {
    const payloadMovimentacoes = novas.map((m) => ({
      processo_id: processoId,
      descricao: m.descricao,
      tipo: classificarTipoMovimentacao(m.descricao),
      data_movimentacao: new Date(m.dataHora).toISOString(),
      fonte: 'datajud',
    }))

    const { error: erroInsert } = await supabaseAdmin
      .from('movimentacoes')
      .insert(payloadMovimentacoes)

    if (!erroInsert) {
      for (const mov of payloadMovimentacoes) {
        const criou = await criarPrazoAutomatico({
          supabaseAdmin,
          escritorioId,
          processoId,
          responsavelId: processoMeta?.responsavel_id ?? null,
          descricaoMov: mov.descricao,
          dataMovIso: mov.data_movimentacao,
        })
        if (criou) prazosAutomaticos++
      }
    }
  }

  await supabaseAdmin.from('monitoramento_logs').insert({
    escritorio_id: escritorioId,
    processo_id: processoId,
    numero_cnj: numeroCnj,
    tribunal: dados.tribunal,
    movimentacoes_encontradas: dados.movimentos.length,
    movimentacoes_novas: novas.length,
    status: 'sucesso',
  })

  return { novas: novas.length, prazosAutomaticos }
}
