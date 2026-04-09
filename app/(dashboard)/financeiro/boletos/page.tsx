import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ArrowLeft, Clock } from 'lucide-react'
import Link from 'next/link'

export default async function BoletosPage() {
  const { escritorioId } = await getAuthContext()
  if (!escritorioId) redirect('/onboarding')

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/financeiro" className="text-slate-400 hover:text-slate-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Geração de Boletos</h1>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-center space-y-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 mx-auto">
          <Clock className="h-7 w-7 text-amber-600" />
        </div>
        <h2 className="text-lg font-semibold text-slate-900">Em breve</h2>
        <p className="text-sm text-slate-600 max-w-sm mx-auto">
          A geração de boletos bancários está em desenvolvimento. Será integrada com gateways como Asaas, Efí Bank ou Celcoin.
        </p>
        <div className="rounded-lg bg-white border border-amber-200 p-4 text-left text-sm text-slate-600">
          <p className="font-semibold text-slate-800 mb-2">Previsão de recursos:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Emissão de boletos para honorários</li>
            <li>Envio automático por e-mail ao cliente</li>
            <li>Conciliação automática com contas a receber</li>
            <li>Suporte a parcelamento</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
