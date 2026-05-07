// -----------------------------------------------
// DETALHE DO CLIENTE — Visualizar dados + processos
// -----------------------------------------------

import { getAuthContext } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { adicionarObservacao } from '@/lib/actions/clientes'
import { UploadDocumento } from '@/components/upload-documento'
import { WhatsAppForm } from '@/components/clientes/WhatsAppForm'
import { PortalClienteButton } from '@/components/clientes/PortalClienteButton'
import {
  ChevronLeft, Pencil, Phone, Mail, MapPin,
  User, FileText, FolderOpen, MessageCircle, FilePlus2,
} from 'lucide-react'
import { decriptarCliente } from '@/lib/cripto'

function formatarData(data: string) {
  return new Date(data).toLocaleDateString('pt-BR')
}

export default async function ClienteDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/onboarding')

  const [{ data: clienteRaw }, { data: processos }, { data: documentos }, { data: docsGerados }, { data: contas }] = await Promise.all([
    supabase
      .from('clientes')
      .select('*')
      .eq('id', id)
      .eq('escritorio_id', escritorioId)
      .single(),

    supabase
      .from('processos')
      .select('id, numero_cnj, tribunal, area_juridica, status')
      .eq('cliente_id', id)
      .eq('escritorio_id', escritorioId)
      .order('criado_em', { ascending: false }),

    supabase
      .from('documentos_cliente')
      .select('id, tipo, nome_arquivo, url_arquivo, criado_em')
      .eq('cliente_id', id)
      .order('criado_em', { ascending: false }),

    supabase
      .from('documentos_gerados')
      .select('id, nome, criado_em')
      .eq('cliente_id', id)
      .order('criado_em', { ascending: false })
      .limit(8),

    supabase
      .from('contas_receber')
      .select('valor, status')
      .eq('cliente_id', id)
      .eq('escritorio_id', escritorioId),
  ])

  if (!clienteRaw) notFound()
  const cliente = decriptarCliente(clienteRaw)

  const resumoFinanceiro = (contas ?? []).reduce(
    (acc, c) => {
      acc.total += c.valor
      if (c.status === 'recebido') acc.recebido += c.valor
      else if (c.status === 'aberto') acc.emAberto += c.valor
      return acc
    },
    { total: 0, recebido: 0, emAberto: 0 },
  )

  function formatarValor(v: number) {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  async function adicionarObservacaoNeste(formData: FormData) {
    'use server'
    await adicionarObservacao(id, formData)
  }

  const LABEL_AREA: Record<string, string> = {
    civil: 'Cível', criminal: 'Criminal', trabalhista: 'Trabalhista',
    previdenciario: 'Previdenciário', tributario: 'Tributário', outro: 'Outro',
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb + ações */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/clientes" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Clientes
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-sm text-slate-700 font-medium">{cliente.nome}</span>
        </div>
        <Link
          href={`/clientes/${id}/editar`}
          className="flex items-center gap-2 text-sm border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors"
        >
          <Pencil className="w-4 h-4" /> Editar
        </Link>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Dados do cliente */}
        <div className="xl:col-span-2 space-y-6">

          {/* Card principal */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <span className="text-amber-700 font-bold text-xl">
                  {cliente.nome.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">{cliente.nome}</h1>
                <p className="text-sm text-slate-400">Cliente desde {formatarData(cliente.criado_em)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cliente.cpf && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-500">CPF:</span>
                  <span className="font-medium text-slate-900">{cliente.cpf}</span>
                </div>
              )}
              {cliente.rg && (
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-500">RG:</span>
                  <span className="font-medium text-slate-900">{cliente.rg}</span>
                </div>
              )}
              {cliente.telefone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <a href={`tel:${cliente.telefone}`} className="text-slate-900 hover:text-amber-600">{cliente.telefone}</a>
                </div>
              )}
              {cliente.whatsapp && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-green-500" />
                  <a href={`https://wa.me/55${cliente.whatsapp?.replace(/\D/g, '')}`} target="_blank" rel="noopener"
                    className="text-slate-900 hover:text-green-600">
                    {cliente.whatsapp} (WhatsApp)
                  </a>
                </div>
              )}
              {cliente.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <a href={`mailto:${cliente.email}`} className="text-slate-900 hover:text-amber-600">{cliente.email}</a>
                </div>
              )}
              {cliente.endereco && (
                <div className="flex items-start gap-2 text-sm col-span-2">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <span className="text-slate-900">{cliente.endereco}</span>
                </div>
              )}
            </div>
          </div>

          {/* Observações e histórico de contato */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Histórico de Contato</h2>
            </div>

            {/* Formulário para nova observação */}
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-100">
              <form action={adicionarObservacaoNeste} className="flex gap-3">
                <input
                  name="observacao"
                  type="text"
                  required
                  placeholder="Registrar ligação, reunião, acordo..."
                  className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                />
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-4 py-2 rounded-lg transition-colors text-sm whitespace-nowrap"
                >
                  Registrar
                </button>
              </form>
            </div>

            <div className="px-5 py-4">
              {cliente.observacoes ? (
                <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans">{cliente.observacoes}</pre>
              ) : (
                <p className="text-sm text-slate-400">Nenhum registro de contato ainda.</p>
              )}
            </div>
          </div>
          {/* Documentos */}
          <UploadDocumento
            clienteId={id}
            escritorioId={escritorioId}
            documentos={documentos ?? []}
          />

          {/* WhatsApp */}
          {(cliente.whatsapp || cliente.telefone) && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-green-500" />
                <h2 className="font-semibold text-slate-900">Enviar WhatsApp</h2>
              </div>
              <div className="px-5 py-4">
                <p className="text-xs text-slate-400 mb-3">
                  Número: <span className="font-medium text-slate-600">{cliente.whatsapp || cliente.telefone}</span>
                </p>
                <WhatsAppForm clienteId={id} />
              </div>
            </div>
          )}
        </div>

        {/* Coluna direita: processos */}
        <div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-slate-400" /> Processos
              </h3>
              <Link href={`/processos/novo`} className="text-xs text-amber-600 hover:text-amber-700">
                + Novo
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {!processos?.length ? (
                <div className="px-5 py-4 text-sm text-slate-400">
                  Nenhum processo vinculado.
                </div>
              ) : (
                processos.map((p) => (
                  <Link
                    key={p.id}
                    href={`/processos/${p.id}`}
                    className="block px-5 py-3 hover:bg-slate-50 transition-colors"
                  >
                    <p className="text-xs font-mono text-slate-900">{p.numero_cnj}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-500">{p.tribunal}</span>
                      <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full">
                        {LABEL_AREA[p.area_juridica] ?? p.area_juridica}
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${p.status === 'ativo' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                        {p.status}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Resumo Financeiro */}
          {(contas ?? []).length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <h3 className="font-semibold text-slate-900 mb-3 text-sm">Resumo Financeiro</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Total cobrado</span>
                  <span className="font-semibold text-slate-900">{formatarValor(resumoFinanceiro.total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Recebido</span>
                  <span className="font-semibold text-emerald-700">{formatarValor(resumoFinanceiro.recebido)}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-slate-100 pt-2">
                  <span className="text-slate-500">Em aberto</span>
                  <span className={`font-semibold ${resumoFinanceiro.emAberto > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                    {formatarValor(resumoFinanceiro.emAberto)}
                  </span>
                </div>
              </div>
              <Link
                href={`/contas-receber?cliente_id=${id}`}
                className="block mt-3 text-xs text-amber-600 hover:text-amber-700 text-center"
              >
                Ver cobranças →
              </Link>
            </div>
          )}

          {/* Portal do Cliente */}
          <PortalClienteButton clienteId={id} clienteNome={cliente.nome} />

          {/* Documentos Gerados */}
          {(docsGerados?.length ?? 0) > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
                  <FilePlus2 className="w-4 h-4 text-emerald-500" /> Documentos Gerados
                </h3>
                <Link href="/documentos" className="text-xs text-emerald-600 hover:text-emerald-700">
                  Ver todos →
                </Link>
              </div>
              <div className="divide-y divide-slate-100">
                {docsGerados!.map((d) => (
                  <Link
                    key={d.id}
                    href={`/documentos/${d.id}`}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="text-xs text-slate-700 flex-1 truncate">{d.nome}</span>
                    <span className="text-xs text-slate-400 shrink-0">
                      {new Date(d.criado_em).toLocaleDateString('pt-BR')}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
