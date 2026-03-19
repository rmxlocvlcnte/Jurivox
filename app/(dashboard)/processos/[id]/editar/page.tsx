// -----------------------------------------------
// EDITAR PROCESSO — Formulário pré-preenchido
// -----------------------------------------------

import { getAuthContext } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { atualizarProcesso } from '@/lib/actions/processos'
import ProcessoForm from '@/components/processos/ProcessoForm'

export default async function EditarProcessoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const [{ data: processo }, { data: clientes }] = await Promise.all([
    supabase
      .from('processos')
      .select('*')
      .eq('id', id)
      .eq('escritorio_id', escritorioId)
      .single(),
    supabase
      .from('clientes')
      .select('id, nome')
      .eq('escritorio_id', escritorioId)
      .order('nome'),
  ])

  if (!processo) notFound()

  // Cria uma action específica para este processo
  async function atualizarEsteProcesso(formData: FormData) {
    'use server'
    await atualizarProcesso(id, formData)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Link href={`/processos/${id}`} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Voltar ao processo
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h1 className="text-xl font-bold text-slate-900 mb-6">Editar Processo</h1>
        <p className="text-sm text-slate-500 font-mono mb-6 -mt-4">{processo.numero_cnj}</p>

        <ProcessoForm
          action={atualizarEsteProcesso}
          clientes={clientes ?? []}
          valores={processo}
          botaoLabel="Salvar Alterações"
        />
      </div>
    </div>
  )
}
