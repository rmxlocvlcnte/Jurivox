// -----------------------------------------------
// CLIENTES — Lista todos os clientes do escritório
// -----------------------------------------------

import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { ListaClientesFiltrada } from '@/components/lista-clientes-filtrada'
import { ExportButton } from '@/components/export-button'
import { ImportCSVButton } from '@/components/import-csv-button'

const EXPORT_COLS = [
  { key: 'nome', label: 'Nome' },
  { key: 'cpf', label: 'CPF' },
  { key: 'email', label: 'E-mail' },
  { key: 'telefone', label: 'Telefone' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'endereco', label: 'Endereço' },
  { key: 'cidade', label: 'Cidade' },
  { key: 'estado', label: 'Estado' },
  { key: 'criado_em', label: 'Cadastrado em', format: (row: any) => row.criado_em ? new Date(row.criado_em).toLocaleDateString('pt-BR') : '' },
]

const IMPORT_COLS = ['nome', 'cpf', 'email', 'telefone', 'whatsapp', 'endereco', 'cidade', 'estado']

export default async function ClientesPage() {
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/onboarding')

  const { data: clientes } = await supabase
    .from('clientes')
    .select('id, nome, cpf, email, telefone, whatsapp, endereco, cidade, estado, criado_em')
    .eq('escritorio_id', escritorioId)
    .order('nome')

  const lista = clientes ?? []

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
          <p className="text-slate-500 text-sm mt-1">
            {lista.length} cliente{lista.length !== 1 ? 's' : ''} cadastrado{lista.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {lista.length > 0 && (
            <ExportButton data={lista} columns={EXPORT_COLS} filename="Clientes - JurisFlow" />
          )}
          <ImportCSVButton entidade="clientes" colunas={IMPORT_COLS} />
          <Link
            href="/clientes/novo"
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
          >
            <Plus className="w-4 h-4" /> Novo Cliente
          </Link>
        </div>
      </div>

      {lista.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
          <div className="w-12 h-12 text-slate-300 mx-auto mb-4 flex items-center justify-center text-4xl">👤</div>
          <h3 className="text-slate-600 font-medium">Nenhum cliente cadastrado</h3>
          <p className="text-slate-400 text-sm mt-1">Cadastre seus clientes para vinculá-los aos processos.</p>
          <Link
            href="/clientes/novo"
            className="inline-flex items-center gap-2 mt-4 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
          >
            <Plus className="w-4 h-4" /> Cadastrar Cliente
          </Link>
        </div>
      ) : (
        <ListaClientesFiltrada clientes={lista} />
      )}
    </div>
  )
}
