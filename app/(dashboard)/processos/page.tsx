// -----------------------------------------------
// PROCESSOS — Lista todos os processos do escritório
// -----------------------------------------------

import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { ListaProcessosFiltrada } from '@/components/lista-processos-filtrada'

export default async function ProcessosPage() {
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/onboarding')

  const { data: processos } = await supabase
    .from('processos')
    .select(`
      id, numero_cnj, tribunal, vara, area_juridica, status, criado_em,
      clientes(nome)
    `)
    .eq('escritorio_id', escritorioId)
    .order('criado_em', { ascending: false })

  const lista = processos ?? []

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Processos</h1>
          <p className="text-slate-500 text-sm mt-1">
            {lista.length} processo{lista.length !== 1 ? 's' : ''} cadastrado{lista.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/processos/novo"
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
        >
          <Plus className="w-4 h-4" /> Novo Processo
        </Link>
      </div>

      <ListaProcessosFiltrada processos={lista as any} />
    </div>
  )
}
