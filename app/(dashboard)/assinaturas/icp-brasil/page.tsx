import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, ShieldCheck, Shield, AlertCircle,
  CheckCircle2, Upload, HardDrive, Cpu, Info,
} from 'lucide-react'
import { CertificadoUpload } from '@/components/icp/CertificadoUpload'

export default async function ICPBrasilPage() {
  const { escritorioId, membroId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/onboarding')

  // Busca certificados já cadastrados para este membro
  const { data: certificados } = await supabase
    .from('certificados_icp')
    .select('id, tipo, titular_nome, titular_cpf, emissor, valido_de, valido_ate, ativo, criado_em')
    .eq('escritorio_id', escritorioId)
    .eq('membro_id', membroId!)
    .order('criado_em', { ascending: false })

  const fmtData = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('pt-BR') : '—'

  const certificadoAtivo = certificados?.find(c => c.ativo)
  const vencido = certificadoAtivo
    ? new Date(certificadoAtivo.valido_ate ?? '') < new Date()
    : false

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/assinaturas" className="text-slate-400 hover:text-slate-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Assinatura ICP-Brasil</h1>
          <p className="text-sm text-slate-500 mt-0.5">Certificados digitais A1 e A3</p>
        </div>
      </div>

      {/* Banner de status */}
      {certificadoAtivo && !vencido ? (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-emerald-900 text-sm">Certificado ativo</p>
            <p className="text-emerald-700 text-xs mt-0.5">
              {certificadoAtivo.titular_nome} · {certificadoAtivo.emissor ?? 'Emissor desconhecido'} ·
              Válido até {fmtData(certificadoAtivo.valido_ate)}
            </p>
          </div>
        </div>
      ) : vencido ? (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900 text-sm">Certificado vencido</p>
            <p className="text-red-700 text-xs mt-0.5">
              Venceu em {fmtData(certificadoAtivo?.valido_ate ?? null)}. Renove ou carregue um novo.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-blue-900 text-sm">Nenhum certificado configurado</p>
            <p className="text-blue-700 text-xs mt-0.5">
              Carregue seu certificado A1 ou configure um A3 para assinar documentos com validade ICP-Brasil.
            </p>
          </div>
        </div>
      )}

      {/* Diferença entre tipos de assinatura */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <h2 className="font-semibold text-slate-800 flex items-center gap-2">
          <Shield className="h-4 w-4 text-slate-500" />
          Tipos de assinatura digital
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              nome: 'Eletrônica Simples',
              badge: 'Disponível',
              badgeCor: 'bg-emerald-100 text-emerald-700',
              icone: ShieldCheck,
              cor: 'text-emerald-500',
              itens: [
                'Validade pela Lei 14.063/2020',
                'Link seguro por e-mail',
                'Trilha: IP + user-agent + timestamp',
                'Sem custo adicional',
              ],
              ativo: true,
            },
            {
              nome: 'Certificado A1',
              badge: 'Configure abaixo',
              badgeCor: 'bg-amber-100 text-amber-700',
              icone: Upload,
              cor: 'text-amber-500',
              itens: [
                'ICP-Brasil — nível avançado',
                'Arquivo .p12 ou .pfx',
                'Assina no browser (sem expor chave)',
                'Requer AC credenciada',
              ],
              ativo: false,
            },
            {
              nome: 'Certificado A3',
              badge: 'Token/Cartão',
              badgeCor: 'bg-violet-100 text-violet-700',
              icone: Cpu,
              cor: 'text-violet-500',
              itens: [
                'ICP-Brasil — nível qualificado',
                'Hardware físico (token USB)',
                'Chave privada no dispositivo',
                'Requer Web Crypto API',
              ],
              ativo: false,
            },
          ].map((tipo) => (
            <div
              key={tipo.nome}
              className={`rounded-xl border p-4 ${tipo.ativo ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <tipo.icone className={`h-4 w-4 ${tipo.cor}`} />
                <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${tipo.badgeCor}`}>
                  {tipo.badge}
                </span>
              </div>
              <p className="font-semibold text-slate-800 text-sm mb-2">{tipo.nome}</p>
              <ul className="space-y-1">
                {tipo.itens.map(item => (
                  <li key={item} className="flex items-start gap-1.5 text-xs text-slate-500">
                    <CheckCircle2 className={`h-3 w-3 mt-0.5 shrink-0 ${tipo.cor}`} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Upload de certificado A1 (client component) */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-800 mb-1 flex items-center gap-2">
          <HardDrive className="h-4 w-4 text-amber-500" />
          Carregar Certificado A1
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Seu arquivo .p12/.pfx é processado <strong>exclusivamente no seu navegador</strong>.
          A chave privada <strong>nunca é enviada ao servidor</strong>.
          Apenas os metadados (nome, CPF, validade) são salvos.
        </p>
        <CertificadoUpload escritorioId={escritorioId} membroId={membroId!} />
      </section>

      {/* Instruções A3 */}
      <section className="rounded-xl border border-violet-200 bg-violet-50/40 p-5">
        <h2 className="font-semibold text-violet-900 mb-2 flex items-center gap-2 text-sm">
          <Cpu className="h-4 w-4" />
          Usando Certificado A3 (Token/Cartão)
        </h2>
        <ol className="space-y-2 text-xs text-violet-800 list-decimal list-inside">
          <li>Instale o driver do seu token/cartão (SafeNet, Gemalto, Watchdata, etc.)</li>
          <li>Instale o <strong>PKCS#11</strong> middleware disponibilizado pela sua AC emissora</li>
          <li>Conecte o token USB ou insira o cartão no leitor</li>
          <li>Ao assinar, o browser irá solicitar o PIN do seu dispositivo</li>
          <li>A assinatura é feita localmente no hardware — máxima segurança</li>
        </ol>
        <p className="mt-3 text-xs text-violet-600">
          ACs credenciadas ICP-Brasil: Certisign, Serpro, Soluti, AC Caixa, Valid, Safeweb, OAB.
        </p>
      </section>

      {/* Certificados cadastrados */}
      {certificados && certificados.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800 text-sm">Certificados cadastrados</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {certificados.map((cert) => {
              const expirado = cert.valido_ate && new Date(cert.valido_ate) < new Date()
              return (
                <div key={cert.id} className="flex items-center gap-4 px-5 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 text-sm">{cert.titular_nome}</p>
                    <p className="text-xs text-slate-500">
                      {cert.tipo} · {cert.emissor ?? 'Emissor desconhecido'} ·
                      Válido até {fmtData(cert.valido_ate)}
                    </p>
                  </div>
                  <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${
                    expirado
                      ? 'bg-red-100 text-red-600'
                      : cert.ativo
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                  }`}>
                    {expirado ? 'Vencido' : cert.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Link para assinatura simples */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
        <p className="text-sm text-slate-600">
          Prefere usar a assinatura eletrônica simples (sem certificado)?{' '}
          <Link href="/assinaturas" className="text-amber-600 hover:text-amber-700 font-semibold">
            Ir para Assinaturas →
          </Link>
        </p>
      </div>
    </div>
  )
}
