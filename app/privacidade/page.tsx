import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalPageShell } from '@/components/legal/LegalPageShell'

export const metadata: Metadata = {
  title: 'Política de Privacidade | Jurivox',
  description: 'Como o Jurivox coleta, usa e protege dados pessoais em conformidade com a LGPD.',
}

export default function PrivacidadePage() {
  return (
    <LegalPageShell titulo="Política de Privacidade" atualizadoEm="20 de maio de 2026">
      <section>
        <h2 className="text-lg font-semibold text-slate-900">1. Controlador e encarregado (DPO)</h2>
        <p>
          O Jurivox atua como operador dos dados inseridos pelo escritório (clientes, processos,
          documentos) e como controlador dos dados de cadastro e uso da plataforma pelos usuários
          da conta. Encarregado de proteção de dados:{' '}
          <a href="mailto:dpo@jurivox.com.br" className="text-blue-600 hover:underline">
            dpo@jurivox.com.br
          </a>
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">2. Dados pessoais tratados</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Dados de cadastro: nome, e-mail, identificador de autenticação, cargo no escritório.</li>
          <li>Dados de uso: logs de acesso, eventos de segurança, preferências e interações na plataforma.</li>
          <li>Dados operacionais do escritório: clientes, processos, prazos, financeiro, documentos e comunicações.</li>
          <li>Dados de pagamento: processados por provedor de pagamentos (não armazenamos número completo de cartão).</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">3. Finalidades e bases legais (LGPD)</h2>
        <p>Tratamos dados com base nas hipóteses do art. 7º da LGPD, conforme o caso:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li><strong>Execução de contrato</strong> — prestação do serviço contratado.</li>
          <li><strong>Obrigação legal</strong> — retenção de registros quando exigido por lei.</li>
          <li><strong>Legítimo interesse</strong> — segurança, prevenção a fraudes e melhoria do serviço.</li>
          <li><strong>Consentimento</strong> — cookies não essenciais e comunicações opcionais.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">4. Compartilhamento e suboperadores</h2>
        <p>
          Utilizamos provedores de infraestrutura, autenticação (Clerk), banco de dados (Supabase),
          pagamentos (Stripe), e-mail e IA, sempre com contratos e medidas compatíveis com a LGPD.
          A relação controlador–operador entre seu escritório e o Jurivox está detalhada no{' '}
          <Link href="/dpa" className="text-blue-600 hover:underline">DPA</Link>.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">5. Retenção e segurança</h2>
        <p>
          Mantemos os dados pelo tempo necessário à prestação do serviço e obrigações legais.
          Adotamos criptografia em trânsito e em repouso quando aplicável, controle de acesso por
          escritório (multi-tenant), autenticação em dois fatores, trilhas de auditoria e backups.
        </p>
      </section>

      <section id="cookies">
        <h2 className="text-lg font-semibold text-slate-900">6. Cookies e tecnologias similares</h2>
        <p>
          <strong>Cookies essenciais:</strong> necessários para login, sessão e segurança (Clerk, Supabase).
          Não podem ser desativados sem prejudicar o funcionamento.
        </p>
        <p className="mt-2">
          <strong>Cookies de diagnóstico (opcionais):</strong> com seu consentimento, registramos erros
          técnicos anonimizados para estabilidade da aplicação. Você pode aceitar ou recusar no banner
          exibido na primeira visita.
        </p>
        <p className="mt-2">
          <strong>Armazenamento local:</strong> preferências de consentimento e PWA podem usar
          localStorage do navegador.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">7. Direitos do titular (art. 18, LGPD)</h2>
        <p>Você pode exercer, mediante solicitação ou ferramentas na plataforma:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Confirmação e acesso aos dados.</li>
          <li>Correção de dados incompletos ou desatualizados.</li>
          <li>Portabilidade (exportação em JSON nas configurações).</li>
          <li>Eliminação dos dados tratados com consentimento ou quando aplicável.</li>
          <li>Revogação do consentimento e informação sobre compartilhamento.</li>
        </ul>
        <p className="mt-2">
          <strong>Exclusão de conta:</strong> em Configurações → Privacidade e Dados, use &quot;Excluir minha conta&quot;.
          Sócios podem solicitar <strong>exclusão do escritório e todos os dados</strong> (direito ao esquecimento
          do conjunto de dados do tenant).
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">8. Incidentes e reclamações</h2>
        <p>
          Comunicações sobre incidentes de segurança serão feitas conforme art. 48 da LGPD.
          Reclamações à ANPD podem ser apresentadas pelo titular após contato prévio conosco.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">9. Contato</h2>
        <p>
          Privacidade e exercício de direitos:{' '}
          <a href="mailto:dpo@jurivox.com.br" className="text-blue-600 hover:underline">
            dpo@jurivox.com.br
          </a>
        </p>
      </section>
    </LegalPageShell>
  )
}
