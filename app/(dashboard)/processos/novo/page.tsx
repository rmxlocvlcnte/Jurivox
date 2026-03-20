// -----------------------------------------------
// NOVO PROCESSO — Formulário de cadastro
// -----------------------------------------------
// Server Component: busca a lista de clientes do banco
// e passa para o ProcessoForm (Client Component)
// que cuida dos campos interativos.
// -----------------------------------------------

import { getAuthContext } from '@/lib/auth'
import { criarProcesso } from '@/lib/actions/processos'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import ProcessoForm from '@/components/processos/ProcessoForm'

export default async function NovoProcessoPage() {
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/onboarding')

  // Busca clientes para o campo de seleção
  const { data: clientes } = await supabase
    .from('clientes')
    .select('id, nome')
    .eq('escritorio_id', escritorioId)
    .order('nome')

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link href="/processos" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Processos
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm text-slate-900 font-medium">Novo Processo</span>
      </div>

      {/* Card do formulário */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h1 className="text-xl font-bold text-slate-900 mb-6">Cadastrar Novo Processo</h1>
        <ProcessoForm
          action={criarProcesso}
          clientes={clientes ?? []}
          botaoLabel="Cadastrar Processo"
        />
      </div>
    </div>
  )
}
