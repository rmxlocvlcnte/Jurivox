import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { RestaurarBackupForm } from '@/components/configuracoes/RestaurarBackupForm'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default async function RestaurarPage() {
  const { escritorioId, cargo } = await getAuthContext()
  if (!escritorioId) redirect('/onboarding')
  if (!['socio', 'admin'].includes(cargo ?? '')) redirect('/configuracoes')

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/configuracoes" className="text-slate-400 hover:text-slate-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Restaurar Backup</h1>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-semibold mb-1">Atenção: operação destrutiva</p>
            <p>A restauração irá sobrescrever dados existentes com os dados do backup. Esta operação não pode ser desfeita. Certifique-se de ter um backup atualizado antes de continuar.</p>
          </div>
        </div>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Selecione o arquivo de backup</h2>
        <RestaurarBackupForm />
      </section>
    </div>
  )
}
