import { criarCliente } from '@/lib/actions/clientes'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

const inputCls = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-amber-400'
const labelCls = 'mb-1 block text-sm font-medium text-slate-700'

export default async function NovoClientePage() {
  async function handleCriarCliente(formData: FormData) {
    'use server'
    await criarCliente(formData)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/clientes" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
          <ChevronLeft className="h-4 w-4" />
          Clientes
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm font-medium text-slate-900">Novo Cliente</span>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="mb-6 text-xl font-bold text-slate-900">Cadastrar novo cliente</h1>

        <form action={handleCriarCliente} className="space-y-5">
          <div>
            <label className={labelCls}>Nome completo *</label>
            <input name="nome" type="text" required placeholder="Maria Aparecida Santos" className={inputCls} />
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Documentos</p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className={labelCls}>CPF</label>
                <input name="cpf" type="text" placeholder="000.000.000-00" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>RG</label>
                <input name="rg" type="text" placeholder="00.000.000-0" className={inputCls} />
              </div>
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Contato</p>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className={labelCls}>Telefone</label>
                  <input name="telefone" type="tel" placeholder="(11) 3333-4444" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>WhatsApp</label>
                  <input name="whatsapp" type="tel" placeholder="(11) 99999-0000" className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>E-mail</label>
                <input name="email" type="email" placeholder="cliente@email.com" className={inputCls} />
              </div>
            </div>
          </div>

          <div>
            <label className={labelCls}>Endereco completo</label>
            <input
              name="endereco"
              type="text"
              placeholder="Rua das Flores, 123 - Jardim Primavera, Sao Paulo/SP"
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <label className={labelCls}>Cidade</label>
              <input name="cidade" type="text" placeholder="Sao Paulo" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Estado</label>
              <input name="estado" type="text" maxLength={2} placeholder="SP" className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Observacoes</label>
            <textarea
              name="observacoes"
              rows={3}
              placeholder="Anotacoes sobre o cliente, historico de contato e preferencias."
              className={`${inputCls} resize-none`}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="rounded-lg bg-amber-500 px-6 py-2.5 text-sm font-semibold text-slate-900 transition-colors hover:bg-amber-600"
            >
              Cadastrar cliente
            </button>
            <Link
              href="/clientes"
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
