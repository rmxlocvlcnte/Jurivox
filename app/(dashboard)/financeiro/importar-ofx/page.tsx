import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ImportarOFXForm } from '@/components/financeiro/ImportarOFXForm'
import { ArrowLeft, FileSpreadsheet } from 'lucide-react'
import Link from 'next/link'

export default async function ImportarOFXPage() {
  const { escritorioId, cargo } = await getAuthContext()
  if (!escritorioId) redirect('/onboarding')
  if (!['socio', 'admin'].includes(cargo ?? '')) redirect('/financeiro')

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/financeiro" className="text-slate-400 hover:text-slate-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-slate-600" />
          <h1 className="text-2xl font-bold text-slate-900">Importar Extrato OFX</h1>
        </div>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500 mb-4">
          Importe extratos bancários no formato OFX para conciliar com suas movimentações financeiras.
          Disponível nos principais bancos: Bradesco, Itaú, Santander, Banco do Brasil, Caixa.
        </p>
        <ImportarOFXForm />
      </section>
    </div>
  )
}
