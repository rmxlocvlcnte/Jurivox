import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalPageShell } from '@/components/legal/LegalPageShell'

export const metadata: Metadata = {
  title: 'Termos de Uso | Jurivox',
  description: 'Termos e condições de uso da plataforma Jurivox.',
}

export default function TermosDeUsoPage() {
  return (
    <LegalPageShell titulo="Termos de Uso" atualizadoEm="20 de maio de 2026">
      <section>
        <h2 className="text-lg font-semibold text-slate-900">1. Aceitação e escopo</h2>
        <p>
          O Jurivox é uma plataforma SaaS de gestão jurídica destinada a escritórios de advocacia e
          profissionais do Direito. Ao criar uma conta, acessar ou utilizar qualquer funcionalidade,
          você declara ter lido e concordado com estes Termos de Uso, com a{' '}
          <Link href="/privacidade" className="text-blue-600 hover:underline">
            Política de Privacidade
          </Link>{' '}
          e, quando aplicável, com o{' '}
          <Link href="/dpa" className="text-blue-600 hover:underline">
            Acordo de Processamento de Dados (DPA)
          </Link>
          .
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">2. Cadastro e elegibilidade</h2>
        <p>
          O usuário deve fornecer informações verdadeiras e manter suas credenciais em sigilo.
          O responsável pelo escritório (sócio ou administrador) é responsável pelos acessos
          concedidos à equipe e pelo cumprimento destes termos por todos os membros vinculados.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">3. Uso permitido e responsabilidades</h2>
        <p>
          É vedado utilizar a plataforma para fins ilícitos, armazenar conteúdo que viole direitos
          de terceiros ou tentar acessar dados de outros escritórios. O usuário é exclusivamente
          responsável pelos dados inseridos (clientes, processos, documentos) e pela conformidade
          do tratamento de dados pessoais de seus clientes com a LGPD, na qualidade de controlador.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">4. Propriedade intelectual e licença</h2>
        <p>
          O software, marca e interface do Jurivox permanecem de titularidade do fornecedor.
          Concedemos licença limitada, não exclusiva e revogável de uso durante a vigência da
          assinatura. Os dados inseridos pelo escritório permanecem de propriedade do controlador.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">5. Planos, cobrança e cancelamento</h2>
        <p>
          Planos podem ser mensais ou anuais, com período de avaliação quando oferecido.
          O não pagamento pode resultar em suspensão de recursos pagos. O cancelamento pode ser
          feito pelo portal de cobrança ou pelas configurações da conta; dados podem ser exportados
          antes do encerramento.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">6. Disponibilidade e suporte</h2>
        <p>
          O serviço é prestado em regime de melhor esforço, com metas de disponibilidade conforme
          plano contratado. Manutenções programadas serão comunicadas quando possível.
          Funcionalidades de IA e integrações externas dependem de provedores terceiros e podem
          sofrer indisponibilidade temporária.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">7. Limitação de responsabilidade</h2>
        <p>
          O Jurivox não substitui parecer jurídico, prazos processuais ou diligência profissional.
          Não nos responsabilizamos por decisões tomadas com base em minutas geradas por IA ou por
          perdas decorrentes de uso indevido da plataforma, salvo dolo ou culpa grave nos limites da lei.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">8. Rescisão e exclusão</h2>
        <p>
          Você pode encerrar sua conta ou solicitar exclusão dos dados nas configurações da plataforma,
          nos termos da Política de Privacidade e da LGPD. Podemos suspender ou encerrar o acesso em
          caso de violação grave destes termos ou exigência legal.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">9. Alterações e lei aplicável</h2>
        <p>
          Estes termos podem ser atualizados com publicação da nova data de vigência.
          Aplica-se a legislação brasileira. Foro: comarca da sede do fornecedor, salvo disposição
          legal em contrário para relações de consumo.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">10. Contato</h2>
        <p>
          Dúvidas sobre estes termos:{' '}
          <a href="mailto:legal@jurivox.com.br" className="text-blue-600 hover:underline">
            legal@jurivox.com.br
          </a>
        </p>
      </section>
    </LegalPageShell>
  )
}
