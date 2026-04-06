// -----------------------------------------------
// NOVO CLIENTE — Formulário de cadastro
// -----------------------------------------------

import { criarCliente } from '@/lib/actions/clientes'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

const inputCls = 'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent'
const labelCls = 'block text-sm font-medium text-slate-700 mb-1'

export default async function NovoClientePage() {
  async function handleCriarCliente(formData: FormData) {
    'use server'
    await criarCliente(formData)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link href="/clientes" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Clientes
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm font-medium text-slate-900">Novo Cliente</span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h1 className="text-xl font-bold text-slate-900 mb-6">Cadastrar Novo Cliente</h1>

        <form action={handleCriarCliente} className="space-y-5">

          {/* Nome */}
          <div>
            <label className={labelCls}>Nome Completo <span className="text-red-500">*</span></label>
            <input name="nome" type="text" required placeholder="Maria Aparecida Santos" className={inputCls} />
          </div>

          {/* Seção: Documentos */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Documentos</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          {/* Seção: Contato */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Contato</p>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          {/* Endereço */}
          <div>
            <label className={labelCls}>Endereço Completo</label>
            <input
              name="endereco"
              type="text"
              placeholder="Rua das Flores, 123 — Jardim Primavera, São Paulo/SP — CEP 01310-100"
              className={inputCls}
            />
          </div>

          {/* Observações */}
          <div>
            <label className={labelCls}>Observações</label>
            <textarea
              name="observacoes"
              rows={3}
              placeholder="Anotações sobre o cliente, histórico de contato, preferências..."
              className={`${inputCls} resize-none`}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm"
            >
              Cadastrar Cliente
            </button>
            <Link href="/clientes" className="px-6 py-2.5 text-sm text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
