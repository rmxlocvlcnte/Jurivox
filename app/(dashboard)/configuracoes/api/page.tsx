import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { exigirCargo } from '@/lib/permissoes'
import Link from 'next/link'
import { ArrowLeft, Key, BookOpen, AlertTriangle } from 'lucide-react'
import { ApiKeyForm } from '@/components/configuracoes/ApiKeyForm'

const ENDPOINTS = [
  { method: 'GET', path: '/api/v1/processos', escopo: 'processos:read', desc: 'Lista processos (paginado)' },
  { method: 'GET', path: '/api/v1/clientes',  escopo: 'clientes:read',  desc: 'Lista clientes (paginado)' },
  { method: 'GET', path: '/api/v1/prazos',    escopo: 'prazos:read',    desc: 'Lista prazos (paginado)' },
]

export default async function ApiKeysPage() {
  const { escritorioId, cargo, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/onboarding')

  const perm = exigirCargo(cargo, ['socio', 'admin'])
  if (perm) redirect('/dashboard')

  const { data: chaves } = await supabase
    .from('api_keys')
    .select('id, nome, key_preview, escopos, ativo, ultimo_uso_em, criado_em')
    .eq('escritorio_id', escritorioId)
    .order('criado_em', { ascending: false })

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/configuracoes" className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <Key className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">API Pública</h1>
            <p className="text-slate-500 text-sm">Chaves para integração com sistemas externos</p>
          </div>
        </div>
      </div>

      {/* Alerta de segurança */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <p className="font-semibold mb-1">Mantenha suas chaves seguras</p>
          <p>Chaves de API fornecem acesso aos seus dados. Nunca compartilhe em código público, repositórios Git ou mensagens. Em caso de comprometimento, revogue imediatamente.</p>
        </div>
      </div>

      {/* Documentação dos endpoints */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-slate-400" />
          <h2 className="font-semibold text-slate-900">Endpoints Disponíveis</h2>
        </div>
        <div className="p-5">
          <p className="text-xs text-slate-500 mb-4">
            Autentique com: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono">Authorization: Bearer &lt;sua-chave&gt;</code>
          </p>
          <div className="space-y-2">
            {ENDPOINTS.map(ep => (
              <div key={ep.path} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded font-mono shrink-0 w-10 text-center">
                  {ep.method}
                </span>
                <code className="text-xs font-mono text-slate-700 shrink-0">{ep.path}</code>
                <span className="text-xs text-slate-400 flex-1">{ep.desc}</span>
                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-mono shrink-0">{ep.escopo}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-4">
            Parâmetros: <code className="font-mono">?page=1&limit=50</code> para paginação.
            Prazos: <code className="font-mono">?status=pendente</code> para filtrar por status.
          </p>
        </div>
      </div>

      {/* Gerenciamento de chaves */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <Key className="w-4 h-4 text-slate-400" />
          <h2 className="font-semibold text-slate-900">Suas Chaves de API</h2>
        </div>
        <div className="p-5">
          <ApiKeyForm chavesIniciais={chaves ?? []} />
        </div>
      </div>
    </div>
  )
}
