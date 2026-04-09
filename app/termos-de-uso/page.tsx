import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Termos de Uso | Jurivox',
  description: 'Termos e condicoes de uso da plataforma Jurivox.',
}

export default function TermosDeUsoPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-3xl font-bold text-slate-900">Termos de Uso</h1>
      <p className="mt-2 text-sm text-slate-500">Ultima atualizacao: 8 de abril de 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-700">
        <section>
          <h2 className="text-lg font-semibold text-slate-900">1. Escopo</h2>
          <p>
            O Jurivox e uma plataforma SaaS de gestao juridica para escritorios e profissionais do Direito.
            Ao usar a plataforma, voce concorda com estes termos.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">2. Responsabilidades do usuario</h2>
          <p>
            O usuario e responsavel pela veracidade dos dados inseridos, pelo uso licito da plataforma e pela
            seguranca das credenciais de acesso da equipe.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">3. Assinatura e faturamento</h2>
          <p>
            Os planos podem ser mensais ou anuais. O nao pagamento pode gerar suspensao dos recursos pagos
            ate regularizacao financeira.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">4. Disponibilidade e limites</h2>
          <p>
            O Jurivox opera em regime de melhor esforco para alta disponibilidade. Recursos podem variar
            conforme plano contratado e limites tecnicos aplicaveis.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">5. Contato</h2>
          <p>
            Para duvidas legais, entre em contato em{' '}
            <a href="mailto:legal@jurivox.com.br" className="text-blue-600 hover:underline">
              legal@jurivox.com.br
            </a>
            .
          </p>
        </section>
      </div>

      <p className="mt-10 text-xs text-slate-400">
        Consulte tambem a{' '}
        <Link href="/privacidade" className="text-slate-600 hover:text-slate-900">
          Politica de Privacidade
        </Link>{' '}
        e o{' '}
        <Link href="/dpa" className="text-slate-600 hover:text-slate-900">
          DPA
        </Link>
        .
      </p>
    </main>
  )
}
