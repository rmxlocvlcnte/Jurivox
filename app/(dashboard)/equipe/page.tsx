import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { enviarConvite } from '@/lib/actions/equipe'
import { Users, Crown, Briefcase, GraduationCap, ShieldCheck, Mail, Clock, Plus, Send } from 'lucide-react'

const CARGO_CONFIG: Record<string, { label: string; cls: string; icon: any }> = {
  socio: { label: 'Sócio', cls: 'bg-amber-100 text-amber-700', icon: Crown },
  admin: { label: 'Admin', cls: 'bg-purple-100 text-purple-700', icon: ShieldCheck },
  advogado: { label: 'Advogado', cls: 'bg-blue-100 text-blue-700', icon: Briefcase },
  estagiario: { label: 'Estagiário', cls: 'bg-green-100 text-green-700', icon: GraduationCap },
}

export default async function EquipePage() {
  const { escritorioId, membroId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/onboarding')

  const [{ data: membros }, { data: escritorio }] = await Promise.all([
    supabase
      .from('membros_escritorio')
      .select('id, nome, email, cargo, criado_em')
      .eq('escritorio_id', escritorioId)
      .order('criado_em', { ascending: true }),

    supabase
      .from('escritorios')
      .select('id, nome, cnpj, email, telefone')
      .eq('id', escritorioId)
      .single(),
  ])

  async function handleConvite(formData: FormData) {
    'use server'
    await enviarConvite(formData)
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900">Equipe</h1>
        <p className="text-slate-500 text-sm mt-1">Membros e convites do escritório</p>
      </div>

      {/* Info do escritório */}
      {escritorio && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Escritório</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Membros */}
        <div className="xl:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400" />
              Membros ({membros?.length ?? 0})
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {!membros?.length ? (
              <div className="px-5 py-8 text-center text-slate-400 text-sm">
                Nenhum membro encontrado.
              </div>
            ) : (
              membros.map((m) => {
                const cfg = CARGO_CONFIG[m.cargo ?? 'advogado'] ?? CARGO_CONFIG.advogado
                const Icon = cfg.icon
                const isEu = m.id === membroId

                return (
                  <div key={m.id} className={`flex items-center gap-4 px-5 py-4 ${isEu ? 'bg-amber-50' : ''}`}>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shrink-0">
                      <span className="text-white font-bold text-sm">
                        {m.nome.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900">{m.nome}</p>
                        {isEu && <span className="text-xs text-amber-600 font-medium">(você)</span>}
                      </div>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3" />
                        {m.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <p className="text-xs text-slate-400 hidden sm:flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(m.criado_em).toLocaleDateString('pt-BR')}
                      </p>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 ${cfg.cls}`}>
                        <Icon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Convidar novo membro */}
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h2 className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
              <Plus className="w-4 h-4" /> Convidar Membro
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Envia um e-mail de convite com o link de cadastro.
            </p>
            <form action={handleConvite} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Nome *</label>
                <input
                  name="nome"
                  type="text"
                  required
                  placeholder="Nome completo"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">E-mail *</label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="email@exemplo.com"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Cargo</label>
                <select
                  name="cargo"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                >
                  <option value="advogado">Advogado</option>
                  <option value="estagiario">Estagiário</option>
                  <option value="socio">Sócio</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold py-2.5 rounded-lg transition-colors text-sm"
              >
                <Send className="w-4 h-4" /> Enviar Convite
              </button>
            </form>
          </div>

          <div className="bg-blue-50 rounded-xl border border-blue-100 p-4">
            <p className="text-xs font-semibold text-blue-800 mb-1">Como funciona?</p>
            <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
              <li>Envie o convite por e-mail</li>
              <li>O convidado acessa o link e cria a conta</li>
              <li>No onboarding, informa o nome do escritório</li>
              <li>Você confirma o acesso aqui</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
