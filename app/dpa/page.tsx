import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'DPA | Jurivox',
  description: 'Acordo de Processamento de Dados (Data Processing Agreement) do Jurivox.',
}

export default function DpaPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-3xl font-bold text-slate-900">Acordo de Processamento de Dados (DPA)</h1>
      <p className="mt-2 text-sm text-slate-500">Ultima atualizacao: 8 de abril de 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-700">
        <section>
          <h2 className="text-lg font-semibold text-slate-900">1. Partes</h2>
          <p>
            O cliente do Jurivox atua como Controlador dos dados de seus clientes. O Jurivox atua como
            Operador, processando dados conforme instrucao do Controlador.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">2. Objeto</h2>
          <p>
            Este DPA regula o tratamento de dados pessoais realizado na plataforma para execucao dos servicos
            contratados, em conformidade com a LGPD.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">3. Medidas de seguranca</h2>
          <p>
            Sao adotadas medidas tecnicas e administrativas de seguranca, incluindo controle de acesso,
            trilhas de auditoria e mecanismos de backup e disponibilidade.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">4. Suboperadores</h2>
          <p>
            O servico pode utilizar provedores de infraestrutura, autenticacao, pagamento e e-mail para
            operacao da plataforma, observando clausulas contratuais apropriadas.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">5. Contato juridico</h2>
          <p>
            Para solicitacao de DPA assinado e temas de compliance:{' '}
            <a href="mailto:legal@jurivox.com.br" className="text-blue-600 hover:underline">
              legal@jurivox.com.br
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  )
}
