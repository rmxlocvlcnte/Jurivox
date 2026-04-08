import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import {
  enviarConvite,
  removerMembro,
  editarCargo,
  cancelarConvite,
} from '@/lib/actions/equipe'
import {
  Users,
  Mail,
  Clock,
  Send,
  Trash2,
  Pencil,
  UserPlus,
  Link as LinkIcon,
} from 'lucide-react'

const CARGO_LABEL: Record<string, string> = {
  socio: 'Socio',
  admin: 'Admin',
  advogado: 'Advogado',
  estagiario: 'Estagiario',
}

export default async function EquipePage() {
  const { escritorioId, membroId, cargo: meuCargo, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/onboarding')

  const podeGerenciar = meuCargo === 'socio' || meuCargo === 'admin'

  const [{ data: membros }, { data: escritorio }, { data: convitesPendentes }] = await Promise.all([
    supabase
      .from('membros_escritorio')
      .select('id, nome, email, cargo, criado_em, ativo')
      .eq('escritorio_id', escritorioId)
      .order('criado_em', { ascending: true }),
    supabase
      .from('escritorios')
      .select('id, nome, cnpj, email, telefone')
      .eq('id', escritorioId)
      .single(),
    supabase
      .from('convites_equipe')
      .select('id, nome_convidado, email_convidado, cargo_convidado, criado_em, expira_em, status')
      .eq('escritorio_id', escritorioId)
      .eq('status', 'pendente')
      .order('criado_em', { ascending: false })
      .limit(20),
  ])

  async function handleConvite(formData: FormData) {
    'use server'
    await enviarConvite(formData)
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Equipe</h1>
        <p className="mt-1 text-sm text-slate-500">Membros, cargos e convites do escritorio</p>
      </div>

      {escritorio && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Escritorio</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-slate-500">Nome</p>
              <p className="text-sm font-semibold text-slate-900">{escritorio.nome}</p>
            </div>
            {escritorio.cnpj && (
              <div>
                <p className="text-xs text-slate-500">CNPJ</p>
                <p className="text-sm font-semibold text-slate-900">{escritorio.cnpj}</p>
              </div>
            )}
            {escritorio.email && (
              <div>
                <p className="text-xs text-slate-500">E-mail</p>
                <p className="text-sm font-semibold text-slate-900">{escritorio.email}</p>
              </div>
            )}
            {escritorio.telefone && (
              <div>
                <p className="text-xs text-slate-500">Telefone</p>
                <p className="text-sm font-semibold text-slate-900">{escritorio.telefone}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="space-y-4 xl:col-span-3">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="flex items-center gap-2 font-semibold text-slate-900">
                <Users className="h-4 w-4 text-slate-400" />
                Membros ({membros?.length ?? 0})
              </h2>
            </div>

            <div className="divide-y divide-slate-100">
              {!membros?.length ? (
                <div className="px-5 py-8 text-center text-sm text-slate-400">Nenhum membro encontrado.</div>
              ) : (
                membros.map((m) => {
                  const isEu = m.id === membroId
                  return (
                    <div key={m.id} className={`px-5 py-4 ${isEu ? 'bg-amber-50' : ''}`}>
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500 font-bold text-white">
                          {m.nome.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-slate-900">{m.nome}</p>
                            {isEu && <span className="text-xs font-medium text-amber-700">(voce)</span>}
                            {!m.ativo && <span className="text-xs text-red-600">inativo</span>}
                          </div>
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                            <Mail className="h-3 w-3" />
                            {m.email}
                          </p>
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                            <Clock className="h-3 w-3" />
                            Desde {new Date(m.criado_em).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                          {CARGO_LABEL[m.cargo] ?? m.cargo}
                        </span>
                      </div>

                      {podeGerenciar && !isEu && (
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <form
                            action={async (fd: FormData) => {
                              'use server'
                              await editarCargo(m.id, fd.get('cargo') as string)
                            }}
                            className="flex items-center gap-2"
                          >
                            <select
                              name="cargo"
                              defaultValue={m.cargo ?? 'advogado'}
                              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
                            >
                              <option value="socio">Socio</option>
                              <option value="admin">Admin</option>
                              <option value="advogado">Advogado</option>
                              <option value="estagiario">Estagiario</option>
                            </select>
                            <button
                              type="submit"
                              className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-700 hover:bg-slate-200"
                            >
                              <Pencil className="h-3 w-3" />
                              Atualizar
                            </button>
                          </form>

                          <form
                            action={async () => {
                              'use server'
                              await removerMembro(m.id)
                            }}
                          >
                            <button
                              type="submit"
                              className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2 py-1 text-xs text-red-600 hover:bg-red-100"
                            >
                              <Trash2 className="h-3 w-3" />
                              Remover
                            </button>
                          </form>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="flex items-center gap-2 font-semibold text-slate-900">
                <LinkIcon className="h-4 w-4 text-slate-400" />
                Convites Pendentes ({convitesPendentes?.length ?? 0})
              </h2>
            </div>
            <div className="divide-y divide-slate-100">
              {!convitesPendentes?.length ? (
                <div className="px-5 py-6 text-sm text-slate-400">Sem convites pendentes.</div>
              ) : (
                convitesPendentes.map((convite) => (
                  <div key={convite.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">{convite.nome_convidado}</p>
                      <p className="text-xs text-slate-500">{convite.email_convidado}</p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        Cargo: {CARGO_LABEL[convite.cargo_convidado] ?? convite.cargo_convidado}
                        {' · '}
                        Expira em {new Date(convite.expira_em).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    {podeGerenciar && (
                      <form
                        action={async () => {
                          'use server'
                          await cancelarConvite(convite.id)
                        }}
                      >
                        <button
                          type="submit"
                          className="rounded-lg bg-red-50 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
                        >
                          Cancelar
                        </button>
                      </form>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4 xl:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-1 flex items-center gap-2 font-semibold text-slate-900">
              <UserPlus className="h-4 w-4" />
              Convidar membro
            </h2>
            <p className="mb-4 text-xs text-slate-500">O convidado recebe um link tokenizado para aceitar e vincular automaticamente.</p>
            <form action={handleConvite} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Nome *</label>
                <input
                  name="nome"
                  type="text"
                  required
                  placeholder="Nome completo"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">E-mail *</label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="email@exemplo.com"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Cargo</label>
                <select
                  name="cargo"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="advogado">Advogado</option>
                  <option value="estagiario">Estagiario</option>
                  <option value="admin">Admin</option>
                  <option value="socio">Socio</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={!podeGerenciar}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 py-2.5 text-sm font-semibold text-slate-900 hover:bg-amber-600 disabled:opacity-60"
              >
                <Send className="h-4 w-4" />
                Enviar convite
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
