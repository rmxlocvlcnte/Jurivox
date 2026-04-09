'use server'

import { getAuthContext } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

interface MovimentacaoOFX {
  data: string
  valor: number
  descricao: string
  tipo: 'credito' | 'debito'
  id_externo: string
}

function parseOFX(conteudo: string): MovimentacaoOFX[] {
  const movs: MovimentacaoOFX[] = []

  // Parser simples de OFX (formato SGML, não XML)
  const transacoes = conteudo.match(/<STMTTRN>([\s\S]*?)<\/STMTTRN>/g) ?? []

  for (const bloco of transacoes) {
    const trntype = bloco.match(/<TRNTYPE>(.*?)</)?.[1]?.trim() ?? ''
    const dtposted = bloco.match(/<DTPOSTED>(.*?)</)?.[1]?.trim() ?? ''
    const trnamt = bloco.match(/<TRNAMT>(.*?)</)?.[1]?.trim() ?? '0'
    const memo = bloco.match(/<MEMO>(.*?)</)?.[1]?.trim() ?? ''
    const fitid = bloco.match(/<FITID>(.*?)</)?.[1]?.trim() ?? ''

    const valor = parseFloat(trnamt.replace(',', '.'))
    if (isNaN(valor) || !dtposted) continue

    // Converte data OFX: YYYYMMDDHHMMSS -> YYYY-MM-DD
    const dataStr = dtposted.slice(0, 8)
    const data = `${dataStr.slice(0, 4)}-${dataStr.slice(4, 6)}-${dataStr.slice(6, 8)}`

    movs.push({
      data,
      valor: Math.abs(valor),
      descricao: memo || trntype,
      tipo: valor > 0 ? 'credito' : 'debito',
      id_externo: fitid,
    })
  }

  return movs
}

export async function importarOFX(formData: FormData) {
  const { escritorioId, cargo, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) return { erro: 'Não autenticado.' }
  if (!['socio', 'admin'].includes(cargo ?? '')) return { erro: 'Sem permissão.' }

  const arquivo = formData.get('arquivo') as File | null
  if (!arquivo) return { erro: 'Arquivo não enviado.' }

  const conteudo = await arquivo.text()
  const movimentacoes = parseOFX(conteudo)

  if (!movimentacoes.length) {
    return { erro: 'Nenhuma transação encontrada no arquivo OFX.' }
  }

  // Categoriza automaticamente baseado no valor
  const dados = movimentacoes.map((m) => ({
    escritorio_id: escritorioId,
    tipo: m.tipo,
    valor: m.valor,
    descricao: m.descricao,
    categoria: m.tipo === 'credito' ? 'receita_honorarios' : 'despesa_geral',
    data: m.data,
    observacoes: `Importado via OFX | ID: ${m.id_externo}`,
  }))

  const { data, error } = await supabase
    .from('movimentacoes_financeiras')
    .insert(dados)
    .select('id')

  if (error) return { erro: 'Erro ao salvar: ' + error.message }

  revalidatePath('/financeiro')
  return { sucesso: true, importados: data?.length ?? 0 }
}
