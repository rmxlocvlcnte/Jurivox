import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Shield, FileText, Download, Settings2, Building2, Plug, Key } from 'lucide-react'
import { buscarEscritorio } from '@/lib/actions/escritorio'
import { EscritorioForm } from '@/components/configuracoes/EscritorioForm'
import { ExclusaoDadosForm } from '@/components/configuracoes/ExclusaoDadosForm'

export default async function ConfiguracoesPage() {
  const { escritorioId, cargo } = await getAuthContext()
  if (!escritorioId) redirect('/onboarding')

  const escritorio = await buscarEscritorio()
  const podeEditar = ['socio', 'admin'].includes(cargo ?? '')

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
          <Settings2 className="h-5 w-5 text-slate-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Configurações</h1>
          <p className="mt-1 text-sm text-slate-500">Gerencie seu escritório e preferências da plataforma</p>
        </div>
      </div>

      {/* Dados do Escritório */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Building2 className="h-4 w-4 text-amber-600" />
          <h2 className="text-sm font-semibold text-slate-900">Dados do Escritório</h2>
        </div>
        {escritorio && podeEditar ? (
          <EscritorioForm escritorio={escritorio} />
        ) : escritorio ? (
          <div className="space-y-2 text-sm text-slate-600">
            <p><span className="font-medium text-slate-900">Nome:</span> {escritorio.nome}</p>
            {escritorio.cnpj && <p><span className="font-medium text-slate-900">CNPJ:</span> {escritorio.cnpj}</p>}
            {escritorio.email && <p><span className="font-medium text-slate-900">E-mail:</span> {escritorio.email}</p>}
            {escritorio.telefone && <p><span className="font-medium text-slate-900">Telefone:</span> {escritorio.telefone}</p>}
            <p className="text-xs text-slate-400 mt-2">Apenas sócios e administradores podem editar.</p>
          </div>
        ) : null}
      </section>

      {/* Privacidade e Dados */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Shield className="h-4 w-4 text-blue-600" />
          <h2 className="text-sm font-semibold text-slate-900">Privacidade e Dados</h2>
        </div>
        <p className="text-sm text-slate-600">
          Exporte os dados do escritório em JSON para portabilidade e governança.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href="/api/backup?formato=json"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Download className="h-4 w-4" />
            Baixar backup JSON
          </a>
          <Link
            href="/configuracoes/restaurar"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Download className="h-4 w-4 rotate-180" />
            Restaurar backup
          </Link>
        </div>
        <div className="mt-6 border-t border-slate-100 pt-5">
          <h3 className="text-sm font-medium text-slate-900">Exclusão de dados e conta</h3>
          <div className="mt-3">
            <ExclusaoDadosForm podeExcluirEscritorio={cargo === 'socio'} />
          </div>
        </div>
      </section>

      {/* Integrações */}
      {podeEditar && (
        <section className="rounded-xl border border-amber-200 bg-amber-50/50 p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Plug className="h-4 w-4 text-amber-600" />
            <h2 className="text-sm font-semibold text-slate-900">Integrações & Serviços</h2>
          </div>
          <p className="text-sm text-slate-600">
            Configure Stripe, WhatsApp, e-mail, DataJud e notificações push.
          </p>
          <div className="mt-3">
            <Link
              href="/configuracoes/integracoes"
              className="inline-flex items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-600 px-4 py-2 text-sm font-semibold text-slate-900 transition-colors"
            >
              <Plug className="h-4 w-4" />
              Ver status das integrações
            </Link>
          </div>
        </section>
      )}

      {/* API Pública */}
      {podeEditar && (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Key className="h-4 w-4 text-slate-600" />
            <h2 className="text-sm font-semibold text-slate-900">API Pública</h2>
          </div>
          <p className="text-sm text-slate-600">
            Gerencie chaves de API para integrar sistemas externos com a plataforma.
          </p>
          <div className="mt-3">
            <Link
              href="/configuracoes/api"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Key className="h-4 w-4" />
              Gerenciar chaves de API
            </Link>
          </div>
        </section>
      )}

      {/* Documentos Legais */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4 text-slate-600" />
          <h2 className="text-sm font-semibold text-slate-900">Documentos Legais</h2>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/termos-de-uso" className="text-blue-600 hover:underline">Termos de Uso</Link>
          <Link href="/privacidade" className="text-blue-600 hover:underline">Política de Privacidade</Link>
          <Link href="/dpa" className="text-blue-600 hover:underline">DPA</Link>
        </div>
      </section>
    </div>
  )
}
