// -----------------------------------------------
// DETALHE DO PROCESSO — Visualizar + Timeline
// -----------------------------------------------
// Mostra todos os dados do processo e a linha do tempo
// de movimentações (do mais recente para o mais antigo).
// Também lista os prazos vinculados ao processo.
// -----------------------------------------------

import { getAuthContext } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { adicionarMovimentacao, mudarStatusProcesso } from '@/lib/actions/processos'
import { adicionarDocumentoProcesso, excluirDocumentoProcesso } from '@/lib/actions/documentos_processo'
import {
  ChevronLeft, Pencil, Calendar, Clock,
  CheckCircle, Circle, FileText, Scale,
  AlertTriangle, MapPin, Gavel, Paperclip, Trash2, ExternalLink, FilePlus2,
} from 'lucide-react'

const LABEL_AREA: Record<string, string> = {
  civil: 'Cível', criminal: 'Criminal', trabalhista: 'Trabalhista',
  previdenciario: 'Previdenciário', tributario: 'Tributário', outro: 'Outro',
}

const LABEL_TIPO: Record<string, string> = {
  andamento: 'Andamento', audiencia: 'Audiência', sentenca: 'Sentença',
  despacho: 'Despacho', prazo: 'Prazo', outro: 'Outro',
}

const COR_TIPO: Record<string, string> = {
  audiencia: 'bg-purple-100 text-purple-700',
  sentenca: 'bg-red-100 text-red-700',
  despacho: 'bg-blue-100 text-blue-700',
  prazo: 'bg-amber-100 text-amber-700',
  andamento: 'bg-slate-100 text-slate-600',
  outro: 'bg-slate-100 text-slate-600',
}

function formatarData(data: string) {
  return new Date(data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatarDataHora(data: string) {
  return new Date(data).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default async function ProcessoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/onboarding')

  // Busca o processo com dados do cliente e responsável
  const { data: processo } = await supabase
    .from('processos')
    .select(`
      *,
      clientes(id, nome, cpf, telefone, email),
      membros_escritorio!responsavel_id(nome)
    `)
    .eq('id', id)
    .eq('escritorio_id', escritorioId)
    .single()

  if (!processo) notFound()

  // Busca movimentações, prazos, documentos e docs gerados em paralelo
  const [{ data: movimentacoes }, { data: prazos }, { data: documentos }, { data: docsGerados }] = await Promise.all([
    supabase
      .from('movimentacoes')
      .select('*')
      .eq('processo_id', id)
      .order('data_movimentacao', { ascending: false }),

    supabase
      .from('prazos')
      .select('*')
      .eq('processo_id', id)
      .order('data_vencimento', { ascending: true }),

    supabase
      .from('documentos_processo')
      .select('*')
      .eq('processo_id', id)
      .order('criado_em', { ascending: false }),

    supabase
      .from('documentos_gerados')
      .select('id, nome, criado_em, templates_documento(tipo)')
      .eq('processo_id', id)
      .order('criado_em', { ascending: false })
      .limit(10),
  ])

  const cliente = processo.clientes as any
  const responsavel = processo.membros_escritorio as any

  async function adicionarMovimentacaoNeste(formData: FormData) {
    'use server'
    await adicionarMovimentacao(id, formData)
  }

  async function adicionarDocumento(formData: FormData) {
    'use server'
    await adicionarDocumentoProcesso(id, formData)
  }

  async function excluirDoc(formData: FormData) {
    'use server'
    const docId = formData.get('doc_id') as string
    await excluirDocumentoProcesso(docId, id)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/processos" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Processos
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-sm text-slate-700 font-mono">{processo.numero_cnj}</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {processo.status === 'ativo' && (
            <form action={mudarStatusProcesso}>
              <input type="hidden" name="processo_id" value={id} />
              <input type="hidden" name="status" value="arquivado" />
              <button type="submit" className="text-xs border border-slate-200 hover:bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg transition-colors">
                Arquivar
              </button>
            </form>
          )}
          {(processo.status === 'ativo' || processo.status === 'arquivado') && (
            <form action={mudarStatusProcesso}>
              <input type="hidden" name="processo_id" value={id} />
              <input type="hidden" name="status" value="encerrado" />
              <button type="submit" className="text-xs border border-red-200 hover:bg-red-50 text-red-600 px-3 py-1.5 rounded-lg transition-colors">
                Encerrar
              </button>
            </form>
          )}
          {(processo.status === 'arquivado' || processo.status === 'encerrado') && (
            <form action={mudarStatusProcesso}>
              <input type="hidden" name="processo_id" value={id} />
              <input type="hidden" name="status" value="ativo" />
              <button type="submit" className="text-xs border border-green-200 hover:bg-green-50 text-green-700 px-3 py-1.5 rounded-lg transition-colors">
                Reativar
              </button>
            </form>
          )}
          <Link
            href={`/processos/${id}/editar`}
            className="flex items-center gap-2 text-sm border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Pencil className="w-4 h-4" /> Editar
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Coluna esquerda: dados do processo */}
        <div className="xl:col-span-2 space-y-6">

          {/* Card principal */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                    {LABEL_AREA[processo.area_juridica] ?? processo.area_juridica}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${processo.status === 'ativo' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                    {processo.status}
                  </span>
                </div>
                <h1 className="text-xl font-bold text-slate-900 mt-2 font-mono">{processo.numero_cnj}</h1>
              </div>
              <Scale className="w-6 h-6 text-slate-400 shrink-0" />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wider">Tribunal</p>
                <p className="text-slate-900 font-medium mt-0.5">{processo.tribunal}</p>
              </div>
              {processo.vara && (
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wider">Vara / Câmara</p>
                  <p className="text-slate-900 font-medium mt-0.5">{processo.vara}</p>
                </div>
              )}
              {processo.classe && (
                <div className="col-span-2">
                  <p className="text-slate-400 text-xs uppercase tracking-wider">Classe Processual</p>
                  <p className="text-slate-900 font-medium mt-0.5">{processo.classe}</p>
                </div>
              )}
              {responsavel?.nome && (
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wider">Responsável</p>
                  <p className="text-slate-900 font-medium mt-0.5">{responsavel.nome}</p>
                </div>
              )}
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wider">Cadastrado em</p>
                <p className="text-slate-900 font-medium mt-0.5">{formatarData(processo.criado_em)}</p>
              </div>
            </div>

            {/* Campos específicos por área */}
            {processo.delegacia && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-500">Delegacia:</span>
                  <span className="font-medium">{processo.delegacia}</span>
                  {processo.numero_inquerito && <span className="text-slate-400">· Inquérito: {processo.numero_inquerito}</span>}
                </div>
              </div>
            )}
            {processo.reclamado && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 text-sm">
                  <Gavel className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-500">Reclamado:</span>
                  <span className="font-medium">{processo.reclamado}</span>
                </div>
              </div>
            )}
            {processo.descricao && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Observações</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{processo.descricao}</p>
              </div>
            )}
          </div>

          {/* Timeline de movimentações */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-400" />
                Timeline de Movimentações
              </h2>
              <span className="text-xs text-slate-400">{movimentacoes?.length ?? 0} registro(s)</span>
            </div>

            {/* Formulário para adicionar movimentação */}
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Nova Movimentação</p>
              <form action={adicionarMovimentacaoNeste} className="space-y-3">
                <textarea
                  name="descricao"
                  rows={2}
                  required
                  placeholder="Descreva o andamento, despacho, audiência..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400 bg-white resize-none"
                />
                <div className="flex items-center gap-3">
                  <select
                    name="tipo"
                    defaultValue="andamento"
                    className="text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                  >
                    <option value="andamento">Andamento</option>
                    <option value="audiencia">Audiência</option>
                    <option value="sentenca">Sentença</option>
                    <option value="despacho">Despacho</option>
                    <option value="prazo">Prazo</option>
                    <option value="outro">Outro</option>
                  </select>
                  <input
                    name="data_movimentacao"
                    type="datetime-local"
                    defaultValue={new Date().toISOString().slice(0, 16)}
                    className="text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                  />
                  <button
                    type="submit"
                    className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-4 py-2 rounded-lg transition-colors text-sm whitespace-nowrap"
                  >
                    Registrar
                  </button>
                </div>
              </form>
            </div>

            {/* Lista de movimentações */}
            <div className="divide-y divide-slate-100">
              {!movimentacoes?.length ? (
                <div className="px-5 py-6 text-center text-slate-400 text-sm">
                  Nenhuma movimentação registrada ainda.
                </div>
              ) : (
                movimentacoes.map((m, index) => (
                  <div key={m.id} className="flex gap-4 px-5 py-4">
                    <div className="flex flex-col items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                      {index < movimentacoes.length - 1 && (
                        <div className="w-px flex-1 bg-slate-200 mt-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${COR_TIPO[m.tipo] ?? COR_TIPO.andamento}`}>
                          {LABEL_TIPO[m.tipo] ?? m.tipo}
                        </span>
                        <span className="text-xs text-slate-400">{formatarDataHora(m.data_movimentacao)}</span>
                        {m.fonte !== 'manual' && (
                          <span className="text-xs bg-green-50 text-green-600 px-1.5 py-0.5 rounded font-medium">{m.fonte}</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{m.descricao}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Coluna direita: cliente + prazos */}
        <div className="space-y-6">

          {/* Card do cliente */}
          {cliente ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <h3 className="font-semibold text-slate-900 mb-3">Cliente</h3>
              <Link href={`/clientes/${cliente.id}`} className="hover:text-amber-600 transition-colors">
                <p className="font-medium text-slate-900">{cliente.nome}</p>
              </Link>
              {cliente.cpf && <p className="text-sm text-slate-500 mt-1">CPF: {cliente.cpf}</p>}
              {cliente.telefone && <p className="text-sm text-slate-500">{cliente.telefone}</p>}
              {cliente.email && <p className="text-sm text-slate-500">{cliente.email}</p>}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <h3 className="font-semibold text-slate-900 mb-2">Cliente</h3>
              <p className="text-sm text-slate-400">Nenhum cliente vinculado.</p>
              <Link href={`/processos/${id}/editar`} className="text-sm text-amber-600 hover:text-amber-700 mt-1 block">
                Vincular cliente →
              </Link>
            </div>
          )}

          {/* Prazos do processo */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" /> Prazos
              </h3>
              <Link href={`/prazos/novo?processo_id=${id}`} className="text-xs text-amber-600 hover:text-amber-700">
                + Novo
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {!prazos?.length ? (
                <div className="px-5 py-4 text-sm text-slate-400">
                  Nenhum prazo cadastrado.
                </div>
              ) : (
                prazos.map((p) => {
                  const hoje = new Date()
                  const venc = new Date(p.data_vencimento + 'T12:00:00')
                  const dias = Math.floor((venc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
                  const vencido = !p.concluido && dias < 0

                  return (
                    <div key={p.id} className="px-5 py-3">
                      <div className="flex items-start gap-2">
                        {p.concluido
                          ? <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                          : vencido
                          ? <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                          : <Circle className="w-4 h-4 text-slate-300 mt-0.5 shrink-0" />
                        }
                        <div>
                          <p className={`text-sm font-medium ${p.concluido ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                            {p.descricao}
                          </p>
                          <p className={`text-xs mt-0.5 ${vencido ? 'text-red-600 font-medium' : 'text-slate-400'}`}>
                            {formatarData(p.data_vencimento)}
                            {!p.concluido && dias >= 0 && ` · ${dias === 0 ? 'Hoje!' : `${dias}d restantes`}`}
                            {vencido && ` · Vencido há ${Math.abs(dias)}d`}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Documentos do processo */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-slate-400" /> Documentos
              </h3>
              <span className="text-xs text-slate-400">{documentos?.length ?? 0}</span>
            </div>

            {/* Formulário de novo documento */}
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
              <form action={adicionarDocumento} className="space-y-2">
                <input
                  name="nome"
                  type="text"
                  required
                  placeholder="Nome do documento"
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400"
                />
                <div className="flex gap-2">
                  <select
                    name="tipo"
                    className="flex-1 px-2 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                  >
                    <option value="peticao">Petição</option>
                    <option value="procuracao">Procuração</option>
                    <option value="contrato">Contrato</option>
                    <option value="sentenca">Sentença</option>
                    <option value="decisao">Decisão</option>
                    <option value="outro">Outro</option>
                  </select>
                  <button type="submit" className="px-3 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-lg transition-colors whitespace-nowrap">
                    + Add
                  </button>
                </div>
                <input
                  name="url"
                  type="url"
                  required
                  placeholder="URL do arquivo (Google Drive, etc.)"
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400"
                />
              </form>
            </div>

            {/* Lista de documentos */}
            <div className="divide-y divide-slate-100">
              {!documentos?.length ? (
                <p className="px-5 py-4 text-xs text-slate-400 text-center">Nenhum documento anexado.</p>
              ) : (
                documentos.map((d) => (
                  <div key={d.id} className="flex items-center gap-3 px-4 py-2.5">
                    <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-900 truncate">{d.nome}</p>
                      <p className="text-xs text-slate-400">{d.tipo}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <a href={d.url_arquivo} target="_blank" rel="noopener noreferrer"
                        className="p-1 rounded text-slate-400 hover:text-amber-600 transition-colors">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <form action={excluirDoc}>
                        <input type="hidden" name="doc_id" value={d.id} />
                        <button type="submit" className="p-1 rounded text-slate-400 hover:text-red-500 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Documentos Gerados */}
          {(docsGerados?.length ?? 0) > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
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

          {/* Ação: Resumir com IA */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
            <h3 className="font-semibold text-slate-900 mb-1">Assistente IA</h3>
            <p className="text-sm text-slate-600 mb-3">
              Analise as movimentações com IA jurídica.
            </p>
            <Link
              href={`/ia?processo_id=${id}`}
              className="block w-full text-center bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
            >
              Analisar com IA →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
