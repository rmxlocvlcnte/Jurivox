// -----------------------------------------------
// CLIENTES — Lista todos os clientes do escritório
// -----------------------------------------------

import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users, Plus, ChevronRight, Phone, Mail } from 'lucide-react'

export default async function ClientesPage() {
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const { data: clientes } = await supabase
    .from('clientes')
    .select('id, nome, cpf, email, telefone, criado_em')
    .eq('escritorio_id', escritorioId)
    .order('nome')

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
          <p className="text-slate-500 text-sm mt-1">
            {clientes?.length ?? 0} cliente{(clientes?.length ?? 0) !== 1 ? 's' : ''} cadastrado{(clientes?.length ?? 0) !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/clientes/novo"
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
        >
          <Plus className="w-4 h-4" /> Novo Cliente
        </Link>
      </div>

      {/* Lista */}
      {!clientes?.length ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-slate-600 font-medium">Nenhum cliente cadastrado</h3>
          <p className="text-slate-400 text-sm mt-1">Cadastre seus clientes para vinculá-los aos processos.</p>
          <Link
            href="/clientes/novo"
            className="inline-flex items-center gap-2 mt-4 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-4 py-2 rounded-lg text-sm"
          >
            <Plus className="w-4 h-4" /> Cadastrar Cliente
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {clientes.map((c) => (
              <Link
                key={c.id}
                href={`/clientes/${c.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors"
              >
                {/* Avatar inicial */}
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <span className="text-amber-700 font-bold text-sm">
                    {c.nome.charAt(0).toUpperCase()}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{c.nome}</p>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500 flex-wrap">
                    {c.cpf && <span>CPF: {c.cpf}</span>}
                    {c.telefone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {c.telefone}
                      </span>
                    )}
                    {c.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {c.email}
                      </span>
                    )}
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
