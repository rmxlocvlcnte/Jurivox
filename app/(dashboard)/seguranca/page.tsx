import { clerkClient } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import {
  ShieldCheck,
  AlertTriangle,
  KeyRound,
  Monitor,
  Smartphone,
  History,
  LogOut,
} from 'lucide-react'
import { getAuthContext } from '@/lib/auth'
import { revogarSessao, revogarOutrasSessoes } from '@/lib/actions/seguranca'
import { AbrirPerfil2FAButton } from '@/components/seguranca-2fa-button'

type AuditLog = {
  id: string
  evento: string
  categoria: string | null
  alvo_tipo: string | null
  alvo_id: string | null
  ip: string | null
  user_agent: string | null
  criado_em: string
  metadata?: Record<string, any> | null
  membro?: { nome?: string | null; email?: string | null } | null
}

function formatarData(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatarTimestamp(ts: number) {
  return new Date(ts).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const EVENTO_LABELS: Record<string, string> = {
  'sessao.revogada': 'Sessão encerrada',
  'sessao.revogar_outros': 'Encerrar outras sessões',
}

export default async function SegurancaPage() {
  const { userId, sessionId, escritorioId, supabase } = await getAuthContext({ exigir2FA: false })
  if (!userId) redirect('/sign-in')
  if (!escritorioId || !supabase) redirect('/onboarding')

  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  const totpAtivo = !!user.totpEnabled
  const backupAtivo = !!user.backupCodeEnabled
  const mfaAtivo = !!user.twoFactorEnabled || totpAtivo || backupAtivo

  const { data: sessions } = await client.sessions.getSessionList({
    userId,
    status: 'active',
    limit: 50,
    offset: 0,
  })

  const { data: logs } = await supabase
    .from('audit_logs')
    .select('id, evento, categoria, alvo_tipo, alvo_id, ip, user_agent, criado_em, metadata, membro:membros_escritorio(nome, email)')
    .eq('escritorio_id', escritorioId)
    .order('criado_em', { ascending: false })
    .limit(50)

  const sessionsOrdenadas = (sessions ?? []).sort((a, b) => b.lastActiveAt - a.lastActiveAt)

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900">Segurança</h1>
        <p className="text-slate-500 text-sm mt-1">2FA obrigatório, gestão de sessões e auditoria</p>
      </div>

      {/* 2FA obrigatório */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-slate-400" />
            <h2 className="font-semibold text-slate-900">Autenticação em duas etapas (2FA)</h2>
          </div>
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${mfaAtivo ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
            {mfaAtivo ? 'Ativo' : 'Obrigatório'}
          </span>
        </div>

        {!mfaAtivo && (
          <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-sm">
            <AlertTriangle className="w-4 h-4 mt-0.5" />
            <div>
              <p className="font-semibold">2FA é obrigatório para acessar o sistema.</p>
              <p className="text-xs text-amber-700 mt-1">
                Ative o 2FA agora para liberar todas as funcionalidades. Recomendamos usar um aplicativo autenticador.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="border border-slate-200 rounded-lg px-3 py-3">
            <p className="text-xs text-slate-500">Aplicativo autenticador (TOTP)</p>
            <p className={`text-sm font-semibold ${totpAtivo ? 'text-emerald-700' : 'text-slate-500'}`}>
              {totpAtivo ? 'Ativo' : 'Não configurado'}
            </p>
          </div>
          <div className="border border-slate-200 rounded-lg px-3 py-3">
            <p className="text-xs text-slate-500">Códigos de backup</p>
            <p className={`text-sm font-semibold ${backupAtivo ? 'text-emerald-700' : 'text-slate-500'}`}>
              {backupAtivo ? 'Ativo' : 'Não gerados'}
            </p>
          </div>
          <div className="border border-slate-200 rounded-lg px-3 py-3">
            <p className="text-xs text-slate-500">Status geral</p>
            <p className={`text-sm font-semibold ${mfaAtivo ? 'text-emerald-700' : 'text-amber-700'}`}>
              {mfaAtivo ? 'Protegido' : 'Exigindo ativação'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <AbrirPerfil2FAButton>
            <KeyRound className="w-4 h-4" /> {mfaAtivo ? 'Gerenciar 2FA' : 'Configurar 2FA'}
          </AbrirPerfil2FAButton>
          <p className="text-xs text-slate-500 flex items-center">
            Você pode gerenciar 2FA e códigos de backup no painel de conta do Clerk.
          </p>
        </div>
      </div>

      {/* Sessões / dispositivos */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <LogOut className="w-4 h-4 text-slate-400" />
            <h2 className="font-semibold text-slate-900">Sessões e dispositivos</h2>
          </div>
          <form action={async () => {
            'use server'
            await revogarOutrasSessoes()
          }}>
            <button
              type="submit"
              className="text-xs font-semibold px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
            >
              Encerrar outras sessões
            </button>
          </form>
        </div>

        <div className="divide-y divide-slate-100">
          {!sessionsOrdenadas.length ? (
            <div className="px-5 py-8 text-center text-slate-400 text-sm">
              Nenhuma sessão ativa encontrada.
            </div>
          ) : (
            sessionsOrdenadas.map(sessao => {
              const activity = sessao.latestActivity
              const isAtual = sessao.id === sessionId
              const Icon = activity?.isMobile ? Smartphone : Monitor
              const navegador = [activity?.browserName, activity?.browserVersion].filter(Boolean).join(' ')
              const local = [activity?.city, activity?.country].filter(Boolean).join(', ')
              return (
                <div key={sessao.id} className="px-5 py-4 flex flex-col md:flex-row md:items-center gap-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isAtual ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-slate-900">
                          {activity?.deviceType ? activity.deviceType : 'Dispositivo'}
                        </p>
                        {isAtual && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                            Atual
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        {navegador || 'Navegador não identificado'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {local || 'Localização não disponível'}{activity?.ipAddress ? ` • ${activity.ipAddress}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 justify-between md:justify-end">
                    <p className="text-xs text-slate-500">
                      Ativo em {formatarTimestamp(sessao.lastActiveAt)}
                    </p>
                    <form action={async () => {
                      'use server'
                      await revogarSessao(sessao.id)
                    }}>
                      <button
                        type="submit"
                        className={`text-xs font-semibold px-3 py-2 rounded-lg transition-colors ${isAtual ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                        disabled={isAtual}
                        title={isAtual ? 'Sessão atual' : 'Encerrar sessão'}
                      >
                        Encerrar
                      </button>
                    </form>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Audit log */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
          <History className="w-4 h-4 text-slate-400" />
          <h2 className="font-semibold text-slate-900">Audit log (últimos 50)</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {!logs?.length ? (
            <div className="px-5 py-8 text-center text-slate-400 text-sm">
              Nenhum evento registrado ainda.
            </div>
          ) : (
            (logs as AuditLog[]).map(log => {
              const membro = log.membro?.nome || log.membro?.email || 'Usuário'
              const eventoLabel = EVENTO_LABELS[log.evento] ?? log.evento
              return (
                <div key={log.id} className="px-5 py-4 flex flex-col md:flex-row md:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{eventoLabel}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {membro} • {log.alvo_tipo ?? 'alvo'} {log.alvo_id ? `#${log.alvo_id.slice(0, 8)}` : ''}
                    </p>
                    {log.metadata && (
                      <p className="text-xs text-slate-400 mt-1 truncate">
                        {JSON.stringify(log.metadata)}
                      </p>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 flex flex-col gap-1 md:text-right">
                    <span>{formatarData(log.criado_em)}</span>
                    {log.ip && <span>{log.ip}</span>}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
