import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FileText, Plus } from 'lucide-react'
import { ListaContratosFiltrada } from '@/components/lista-contratos-filtrada'
import { ExportButton } from '@/components/export-button'

const EXPORT_COLS = [
  { key: 'nome', label: 'Nome' },
  { key: 'tipo', label: 'Tipo' },
  { key: 'status', label: 'Status' },
  { key: 'cliente', label: 'Cliente', format: (row: any) => (row.clientes as any)?.nome ?? '' },
  { key: 'processo', label: 'Processo', format: (row: any) => (row.processos as any)?.numero_cnj ?? '' },
  { key: 'valor_fixo', label: 'Valor Fixo (R$)', format: (row: any) => row.valor_fixo != null ? Number(row.valor_fixo).toFixed(2) : '' },
  { key: 'valor_hora', label: 'Valor/Hora (R$)', format: (row: any) => row.valor_hora != null ? Number(row.valor_hora).toFixed(2) : '' },
  { key: 'percentual_exito', label: '% Êxito', format: (row: any) => row.percentual_exito != null ? `${row.percentual_exito}%` : '' },
  { key: 'responsavel', label: 'Responsável', format: (row: any) => (row.membros_escritorio as any)?.nome ?? '' },
  { key: 'criado_em', label: 'Criado em', format: (row: any) => row.criado_em ? new Date(row.criado_em).toLocaleDateString('pt-BR') : '' },
]

export default async function ContratosPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page } = await searchParams
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/onboarding')

  const pageNum = Math.max(1, parseInt(page ?? '1', 10) || 1)
  const pageSize = 50
  const limit = pageNum * pageSize

  const { data: contratos, count } = await supabase
    .from('contratos')
    .select(`
      id, nome, tipo, status, valor_fixo, valor_hora, percentual_exito, criado_em,
      clientes(nome),
      processos(numero_cnj),
      membros_escritorio(nome)
    `, { count: 'exact' })
    .eq('escritorio_id', escritorioId)
    .order('criado_em', { ascending: false })
    .range(0, limit - 1)

  const ativos = contratos?.filter(c => c.status === 'ativo').length ?? 0
  const suspensos = contratos?.filter(c => c.status === 'suspenso').length ?? 0
  const total = count ?? contratos?.length ?? 0
  const carregados = contratos?.length ?? 0

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">Contratos</h1>
          <p className="text-slate-500 text-sm mt-1">Relações comerciais com clientes</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {!!contratos?.length && (
            <ExportButton data={contratos ?? []} columns={EXPORT_COLS} filename="Contratos - JurisFlow" />
          )}
          <Link
            href="/contratos/novo"
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-3 md:px-4 py-2 rounded-lg transition-colors text-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo Contrato</span>
            <span className="sm:hidden">Novo</span>
          </Link>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', valor: contratos?.length ?? 0, cls: 'text-slate-900', bg: 'bg-slate-50' },
          { label: 'Ativos', valor: ativos, cls: 'text-green-700', bg: 'bg-green-50' },
          { label: 'Suspensos', valor: suspensos, cls: 'text-amber-700', bg: 'bg-amber-50' },
          { label: 'Encerrados', valor: (contratos?.length ?? 0) - ativos - suspensos, cls: 'text-slate-500', bg: 'bg-slate-50' },
        ].map(({ label, valor, cls, bg }) => (
          <div key={label} className={`${bg} rounded-xl p-4 border border-slate-100`}>
            <p className="text-xs text-slate-500">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${cls}`}>{valor}</p>
          </div>
        ))}
      </div>

      {/* Lista */}
      {!contratos?.length ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-10 text-center">
          <FileText className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Nenhum contrato cadastrado.</p>
          <Link href="/contratos/novo" className="block mt-2 text-amber-600 hover:text-amber-700 text-sm font-medium">
            Cadastrar primeiro contrato →
          </Link>
        </div>
      ) : (
        <ListaContratosFiltrada contratos={contratos as any} />
      )}

      {carregados < total && (
        <div className="flex items-center justify-center">
          <Link
            href={`/contratos?page=${pageNum + 1}`}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Carregar mais
          </Link>
        </div>
      )}

      {total > 0 && (
        <p className="text-xs text-slate-400 text-center">
          Mostrando {carregados} de {total} contratos
        </p>
      )}
    </div>
  )
}