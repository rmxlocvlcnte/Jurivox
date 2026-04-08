import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Politica de Privacidade | JurisFlow',
  description: 'Como o JurisFlow coleta, usa e protege dados pessoais.',
}

export default function PrivacidadePage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-3xl font-bold text-slate-900">Politica de Privacidade</h1>
      <p className="mt-2 text-sm text-slate-500">Ultima atualizacao: 8 de abril de 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-700">
        <section>
          <h2 className="text-lg font-semibold text-slate-900">1. Dados tratados</h2>
          <p>
            Tratamos dados de cadastro da conta, dados de uso da plataforma e dados operacionais inseridos
            pelo escritorio (clientes, processos e documentos).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">2. Finalidade</h2>
          <p>
            Os dados sao utilizados para autenticacao, funcionamento das funcionalidades juridicas, cobranca,
            suporte tecnico e seguranca da aplicacao.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">3. Base legal</h2>
          <p>
            O tratamento segue a LGPD, com base em execucao de contrato, cumprimento de obrigacao legal
            e legitimo interesse, conforme o contexto de cada operacao.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">4. Direitos do titular</h2>
          <p>
            O titular pode solicitar acesso, correcao, portabilidade e exclusao dos dados quando aplicavel,
            conforme art. 18 da LGPD.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">5. Contato</h2>
          <p>
            Demandas de privacidade e DPO:{' '}
            <a href="mailto:dpo@jurisflow.com.br" className="text-blue-600 hover:underline">
              dpo@jurisflow.com.br
            </a>
            .
          </p>
        </section>
      </div>

      <p className="mt-10 text-xs text-slate-400">
        Termos complementares em{' '}
        <Link href="/termos-de-uso" className="text-slate-600 hover:text-slate-900">
          Termos de Uso
        </Link>{' '}
        e{' '}
        <Link href="/dpa" className="text-slate-600 hover:text-slate-900">
          DPA
        </Link>
        .
      </p>
    </main>
  )
}
