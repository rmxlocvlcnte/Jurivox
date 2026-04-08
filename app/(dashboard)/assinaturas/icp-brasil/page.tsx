import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ArrowLeft, ShieldCheck, Clock } from 'lucide-react'
import Link from 'next/link'

export default async function ICPBrasilPage() {
  const { escritorioId } = await getAuthContext()
  if (!escritorioId) redirect('/onboarding')

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/assinaturas" className="text-slate-400 hover:text-slate-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Assinatura ICP-Brasil</h1>
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-8 text-center space-y-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 mx-auto">
          <ShieldCheck className="h-7 w-7 text-blue-600" />
        </div>
        <h2 className="text-lg font-semibold text-slate-900">Assinatura Qualificada em breve</h2>
        <p className="text-sm text-slate-600 max-w-sm mx-auto">
          A assinatura com certificado digital ICP-Brasil (A1/A3) está planejada para integração futura com Certisign, Serpro ou Soluti.
        </p>
        <div className="rounded-lg bg-white border border-blue-200 p-4 text-left text-sm text-slate-600">
          <p className="font-semibold text-slate-800 mb-2">Assinatura atual (disponível):</p>
          <p className="mb-2">O JurisFlow já oferece <strong>assinatura eletrônica simples</strong> com validade jurídica pela <strong>Lei 14.063/2020</strong> — trilha probatória com IP, user-agent e timestamp.</p>
          <Link href="/assinaturas" className="text-amber-600 hover:text-amber-700 font-medium">
            Usar assinatura eletrônica →
          </Link>
        </div>
      </div>
    </div>
  )
}
