import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalPageShell } from '@/components/legal/LegalPageShell'

export const metadata: Metadata = {
  title: 'DPA | Jurivox',
  description: 'Acordo de Processamento de Dados (Data Processing Agreement) do Jurivox.',
}

export default function DpaPage() {
  return (
    <LegalPageShell titulo="Acordo de Processamento de Dados (DPA)" atualizadoEm="20 de maio de 2026">
      <section>
        <h2 className="text-lg font-semibold text-slate-900">1. Partes e papéis</h2>
        <p>
          O <strong>Cliente</strong> (escritório de advocacia contratante) atua como{' '}
          <strong>Controlador</strong> dos dados pessoais de seus clientes e terceiros inseridos na plataforma.
          O <strong>Jurivox</strong> atua como <strong>Operador</strong>, tratando dados pessoais exclusivamente
          conforme instruções documentadas do Controlador e para execução do contrato de serviços.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">2. Objeto e duração</h2>
        <p>
          Este DPA integra os Termos de Uso e a Política de Privacidade. Aplica-se enquanto perdurar
          a relação contratual e até a eliminação ou devolução dos dados pessoais tratados, conforme
          solicitado pelo Controlador ou previsto em lei.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">3. Instruções e finalidade</h2>
        <p>
          O Operador tratará dados para: hospedagem, processamento, backup, suporte, segurança,
          funcionalidades contratadas (gestão processual, financeiro, IA, assinaturas digitais, etc.)
          e cumprimento de obrigações legais aplicáveis ao Operador.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">4. Obrigações do Operador</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Tratar dados apenas conforme instruções lícitas do Controlador.</li>
          <li>Garantir confidencialidade de pessoas autorizadas a tratar dados.</li>
          <li>Adotar medidas técnicas e administrativas de segurança (art. 46, LGPD).</li>
          <li>Auxiliar o Controlador no atendimento a direitos dos titulares, quando aplicável.</li>
          <li>Notificar incidentes de segurança relevantes sem atraso injustificado.</li>
          <li>Eliminar ou devolver dados ao término do contrato, salvo retenção legal.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">5. Suboperadores</h2>
        <p>
          O Controlador autoriza o uso de suboperadores necessários à operação, incluindo, de forma
          indicativa: provedor de nuvem e banco de dados, autenticação, gateway de pagamento, envio de
          e-mail e provedores de IA. Lista atualizada mediante solicitação a{' '}
          <a href="mailto:legal@jurivox.com.br" className="text-blue-600 hover:underline">
            legal@jurivox.com.br
          </a>
          . Alterações relevantes serão comunicadas com antecedência razoável.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">6. Transferência internacional</h2>
        <p>
          Dados podem ser processados em servidores fora do Brasil. Nesses casos, aplicamos cláusulas
          contratuais padrão, avaliações de impacto quando necessárias e medidas adicionais conforme
          arts. 33 a 36 da LGPD.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">7. Auditoria e documentação</h2>
        <p>
          Mediante solicitação razoável e acordo de confidencialidade, disponibilizamos informações
          necessárias para demonstrar conformidade. Registros de operações de tratamento relevantes
          são mantidos conforme política interna de retenção.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">8. Responsabilidade</h2>
        <p>
          Cada parte responde pelas violações da LGPD na medida de sua atuação como controlador ou
          operador. O Controlador é responsável pela licitude das instruções e bases legais do
          tratamento dos dados de seus clientes.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">9. DPA assinado e contato</h2>
        <p>
          Este documento resume o acordo padrão incorporado ao contrato. Para versão assinada em
          papel ou PDF com dados do escritório:{' '}
          <a href="mailto:legal@jurivox.com.br" className="text-blue-600 hover:underline">
            legal@jurivox.com.br
          </a>
          . Consulte também a{' '}
          <Link href="/privacidade" className="text-blue-600 hover:underline">
            Política de Privacidade
          </Link>{' '}
          e os{' '}
          <Link href="/termos-de-uso" className="text-blue-600 hover:underline">
            Termos de Uso
          </Link>
          .
        </p>
      </section>
    </LegalPageShell>
  )
}
