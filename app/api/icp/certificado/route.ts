import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })

  const supabase = createAdminClient()

  // Busca o membro
  const { data: membro } = await supabase
    .from('membros_escritorio')
    .select('id, escritorio_id')
    .eq('clerk_user_id', userId)
    .order('criado_em', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!membro) {
    return NextResponse.json({ erro: 'Membro não encontrado.' }, { status: 403 })
  }

  const body = await req.json()

  // Valida campos obrigatórios
  if (!body.titular_nome || !body.tipo) {
    return NextResponse.json({ erro: 'Dados incompletos.' }, { status: 400 })
  }

  // Desativa certificado A1 anterior (um ativo por vez)
  await supabase
    .from('certificados_icp')
    .update({ ativo: false, atualizado_em: new Date().toISOString() })
    .eq('membro_id', membro.id)
    .eq('tipo', body.tipo)
    .eq('ativo', true)

  // Salva o novo certificado
  const { error } = await supabase
    .from('certificados_icp')
    .insert({
      escritorio_id: membro.escritorio_id,
      membro_id: membro.id,
      tipo: body.tipo ?? 'A1',
      titular_nome: body.titular_nome,
      titular_cpf: body.titular_cpf ?? null,
      titular_cnpj: body.titular_cnpj ?? null,
      emissor: body.emissor ?? null,
      numero_serie: body.numero_serie ?? null,
      valido_de: body.valido_de ? new Date(body.valido_de).toISOString() : null,
      valido_ate: body.valido_ate ? new Date(body.valido_ate).toISOString() : null,
      ativo: true,
    })

  if (error) {
    console.error('Erro ao salvar certificado ICP:', error)
    return NextResponse.json({ erro: 'Erro ao salvar certificado.' }, { status: 500 })
  }

  return NextResponse.json({ sucesso: true })
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })

  const supabase = createAdminClient()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ erro: 'ID obrigatório.' }, { status: 400 })

  const { data: membro } = await supabase
    .from('membros_escritorio')
    .select('id')
    .eq('clerk_user_id', userId)
    .limit(1)
    .maybeSingle()

  if (!membro) return NextResponse.json({ erro: 'Não autorizado.' }, { status: 403 })

  await supabase
    .from('certificados_icp')
    .update({ ativo: false, atualizado_em: new Date().toISOString() })
    .eq('id', id)
    .eq('membro_id', membro.id)

  return NextResponse.json({ sucesso: true })
}
