// -----------------------------------------------
// EDITAR CLIENTE — Formulário pré-preenchido
// -----------------------------------------------

import { getAuthContext } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { atualizarCliente } from '@/lib/actions/clientes'

const inputCls = 'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent'
const labelCls = 'block text-sm font-medium text-slate-700 mb-1'

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
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href={`/clientes/${id}`}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Voltar ao cliente
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h1 className="text-xl font-bold text-slate-900 mb-1">Editar Cliente</h1>
        <p className="text-sm text-slate-400 mb-6">{cliente.nome}</p>

        <form action={atualizarEsteCliente} className="space-y-5">

          {/* Nome */}
          <div>
            <label className={labelCls}>Nome Completo <span className="text-red-500">*</span></label>
            <input
              name="nome"
              type="text"
              required
              defaultValue={cliente.nome ?? ''}
              className={inputCls}
            />
          </div>

          {/* Documentos */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Documentos</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>CPF</label>
                <input name="cpf" type="text" defaultValue={cliente.cpf ?? ''} placeholder="000.000.000-00" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>RG</label>
                <input name="rg" type="text" defaultValue={cliente.rg ?? ''} placeholder="00.000.000-0" className={inputCls} />
              </div>
            </div>
          </div>

          {/* Contato */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Contato</p>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Telefone</label>
                  <input name="telefone" type="tel" defaultValue={cliente.telefone ?? ''} placeholder="(11) 3333-4444" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>WhatsApp</label>
                  <input name="whatsapp" type="tel" defaultValue={cliente.whatsapp ?? ''} placeholder="(11) 99999-0000" className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>E-mail</label>
                <input name="email" type="email" defaultValue={cliente.email ?? ''} placeholder="cliente@email.com" className={inputCls} />
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div>
            <label className={labelCls}>Endereço Completo</label>
            <input
              name="endereco"
              type="text"
              defaultValue={cliente.endereco ?? ''}
              placeholder="Rua das Flores, 123 — Jardim Primavera, São Paulo/SP"
              className={inputCls}
            />
          </div>

          {/* Observações */}
          <div>
            <label className={labelCls}>Observações</label>
            <textarea
              name="observacoes"
              rows={3}
              defaultValue={cliente.observacoes ?? ''}
              placeholder="Anotações sobre o cliente..."
              className={`${inputCls} resize-none`}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm"
            >
              Salvar Alterações
            </button>
            <Link
              href={`/clientes/${id}`}
              className="px-6 py-2.5 text-sm text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
