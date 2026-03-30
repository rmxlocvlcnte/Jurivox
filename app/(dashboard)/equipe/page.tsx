import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Users, Crown, Briefcase, GraduationCap, ShieldCheck, Mail, Clock } from 'lucide-react'

const CARGO_CONFIG: Record<string, { label: string; cls: string; icon: any }> = {
  socio: { label: 'Sócio', cls: 'bg-amber-100 text-amber-700', icon: Crown },
  admin: { label: 'Admin', cls: 'bg-purple-100 text-purple-700', icon: ShieldCheck },
  advogado: { label: 'Advogado', cls: 'bg-blue-100 text-blue-700', icon: Briefcase },
  estagiario: { label: 'Estagiário', cls: 'bg-green-100 text-green-700', icon: GraduationCap },
}

export default async function EquipePage() {
  const { escritorioId, membroId, cargo, supabase } = await getAuthContext()
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

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900">Equipe</h1>
        <p className="text-slate-500 text-sm mt-1">Membros do escritório</p>
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

      {/* Membros */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
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

      {/* Aviso de convite */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-1">Adicionar novos membros</h3>
        <p className="text-sm text-slate-500">
          Para convidar novos membros à equipe, compartilhe o link da plataforma.
          Ao se cadastrarem, basta atribuí-los ao mesmo escritório no onboarding.
          Em breve: sistema de convites por e-mail diretamente aqui.
        </p>
      </div>
    </div>
  )
}
