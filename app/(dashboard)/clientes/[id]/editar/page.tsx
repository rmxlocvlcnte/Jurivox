import { getAuthContext } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { atualizarCliente } from '@/lib/actions/clientes'

const inputCls = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-amber-400'
const labelCls = 'mb-1 block text-sm font-medium text-slate-700'

export default async function EditarClientePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/onboarding')

  const { data: cliente } = await supabase
    .from('clientes')
    .select('*')
    .eq('id', id)
    .eq('escritorio_id', escritorioId)
    .single()

  if (!cliente) notFound()

  async function atualizarEsteCliente(formData: FormData) {
    'use server'
    await atualizarCliente(id, formData)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <Link href={`/clientes/${id}`} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
          <ChevronLeft className="h-4 w-4" />
          Voltar ao cliente
        </Link>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-xl font-bold text-slate-900">Editar cliente</h1>
        <p className="mb-6 text-sm text-slate-400">{cliente.nome}</p>

        <form action={atualizarEsteCliente} className="space-y-5">
          <div>
            <label className={labelCls}>Nome completo *</label>
            <input name="nome" type="text" required defaultValue={cliente.nome ?? ''} className={inputCls} />
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Documentos</p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className={labelCls}>CPF</label>
                <input name="cpf" type="text" defaultValue={cliente.cpf ?? ''} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>RG</label>
                <input name="rg" type="text" defaultValue={cliente.rg ?? ''} className={inputCls} />
              </div>
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Contato</p>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className={labelCls}>Telefone</label>
                  <input name="telefone" type="tel" defaultValue={cliente.telefone ?? ''} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>WhatsApp</label>
                  <input name="whatsapp" type="tel" defaultValue={cliente.whatsapp ?? ''} className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>E-mail</label>
                <input name="email" type="email" defaultValue={cliente.email ?? ''} className={inputCls} />
              </div>
            </div>
          </div>

          <div>
            <label className={labelCls}>Endereco completo</label>
            <input name="endereco" type="text" defaultValue={cliente.endereco ?? ''} className={inputCls} />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <label className={labelCls}>Cidade</label>
              <input name="cidade" type="text" defaultValue={cliente.cidade ?? ''} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Estado</label>
              <input name="estado" type="text" maxLength={2} defaultValue={cliente.estado ?? ''} className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Observacoes</label>
            <textarea
              name="observacoes"
              rows={3}
              defaultValue={cliente.observacoes ?? ''}
              className={`${inputCls} resize-none`}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="rounded-lg bg-amber-500 px-6 py-2.5 text-sm font-semibold text-slate-900 transition-colors hover:bg-amber-600"
            >
              Salvar alteracoes
            </button>
            <Link
              href={`/clientes/${id}`}
              className="rounded-lg border border-slate-200 px-6 py-2.5 text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
