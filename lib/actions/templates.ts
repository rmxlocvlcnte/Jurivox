'use server'

import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { exigirCargo, CARGOS_OPERACIONAIS } from '@/lib/permissoes'

const TemplateSchema = z.object({
  nome: z.string().min(2, 'Nome obrigatório.').max(200),
  tipo: z.enum(['contrato', 'peticao', 'procuracao', 'notificacao', 'acordo', 'outro'] as const),
  conteudo: z.string().min(10, 'Conteúdo deve ter pelo menos 10 caracteres.'),
})

export async function criarTemplate(formData: FormData) {
  const { escritorioId, membroId, cargo, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const perm = exigirCargo(cargo, CARGOS_OPERACIONAIS, 'Sem permissão para criar templates.')
  if (perm) return perm

  const parse = TemplateSchema.safeParse({
    nome: (formData.get('nome') as string)?.trim(),
    tipo: formData.get('tipo') as string,
    conteudo: formData.get('conteudo') as string,
  })
  if (!parse.success) return { erro: parse.error.issues[0]?.message ?? 'Dados inválidos.' }

  // Extrai variáveis do formato {{variavel}}
  const variaveis = [...new Set(
    (parse.data.conteudo.match(/\{\{([^}]+)\}\}/g) ?? []).map(v => v.slice(2, -2).trim())
  )]

  const { data: template, error } = await supabase
    .from('templates_documento')
    .insert({
      ...parse.data,
      variaveis,
      escritorio_id: escritorioId,
      criado_por: membroId,
    })
    .select('id')
    .single()

  if (error || !template) {
    console.error('Erro ao criar template:', error)
    return { erro: 'Não foi possível criar o template.' }
  }

  revalidatePath('/templates')
  redirect(`/templates/${template.id}`)
}

export async function atualizarTemplate(id: string, formData: FormData) {
  const { escritorioId, cargo, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const perm = exigirCargo(cargo, CARGOS_OPERACIONAIS, 'Sem permissão para editar templates.')
  if (perm) return perm

  const parse = TemplateSchema.safeParse({
    nome: (formData.get('nome') as string)?.trim(),
    tipo: formData.get('tipo') as string,
    conteudo: formData.get('conteudo') as string,
  })
  if (!parse.success) return { erro: parse.error.issues[0]?.message ?? 'Dados inválidos.' }

  const variaveis = [...new Set(
    (parse.data.conteudo.match(/\{\{([^}]+)\}\}/g) ?? []).map(v => v.slice(2, -2).trim())
  )]

  const { error } = await supabase
    .from('templates_documento')
    .update({ ...parse.data, variaveis, atualizado_em: new Date().toISOString() })
    .eq('id', id)
    .eq('escritorio_id', escritorioId)

  if (error) return { erro: 'Não foi possível atualizar o template.' }

  revalidatePath('/templates')
  revalidatePath(`/templates/${id}`)
  redirect(`/templates/${id}`)
}

export async function excluirTemplate(id: string) {
  const { escritorioId, cargo, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const perm = exigirCargo(cargo, CARGOS_OPERACIONAIS, 'Sem permissão para excluir templates.')
  if (perm) return perm

  const { error } = await supabase
    .from('templates_documento')
    .delete()
    .eq('id', id)
    .eq('escritorio_id', escritorioId)

  if (error) return { erro: 'Não foi possível excluir o template.' }

  revalidatePath('/templates')
  return { sucesso: true }
}

export async function gerarDocumentoDeTemplate(
  templateId: string,
  variaveis: Record<string, string>,
  processoId?: string,
  clienteId?: string,
) {
  const { escritorioId, membroId, cargo, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const perm = exigirCargo(cargo, CARGOS_OPERACIONAIS, 'Sem permissão.')
  if (perm) return perm

  const { data: template } = await supabase
    .from('templates_documento')
    .select('nome, conteudo')
    .eq('id', templateId)
    .single()

  if (!template) return { erro: 'Template não encontrado.' }

  // Substitui as variáveis no conteúdo
  let conteudo = template.conteudo
  for (const [key, val] of Object.entries(variaveis)) {
    conteudo = conteudo.replaceAll(`{{${key}}}`, val)
  }

  const { data: doc, error } = await supabase
    .from('documentos_gerados')
    .insert({
      escritorio_id: escritorioId,
      template_id: templateId,
      processo_id: processoId ?? null,
      cliente_id: clienteId ?? null,
      nome: template.nome,
      conteudo,
      criado_por: membroId,
    })
    .select('id')
    .single()

  if (error || !doc) return { erro: 'Não foi possível gerar o documento.' }

  revalidatePath('/templates')
  return { sucesso: true, documentoId: doc.id }
}
