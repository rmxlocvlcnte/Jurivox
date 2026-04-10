import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

// Armazena subscrições Web Push como JSON no Supabase Storage
// (não requer nova tabela — usa bucket existente)
const BUCKET = 'push-subs'

async function garantirBucket(supabase: ReturnType<typeof createAdminClient>) {
  const { data: buckets } = await supabase.storage.listBuckets()
  const existe = buckets?.some(b => b.name === BUCKET)
  if (!existe) {
    await supabase.storage.createBucket(BUCKET, { public: false, fileSizeLimit: 4096 })
  }
}

export async function POST(req: NextRequest) {
  const { membroId, escritorioId } = await getAuthContext()
  if (!membroId || !escritorioId) {
    return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })
  }

  const body = await req.json()
  const { subscription } = body as { subscription: Record<string, unknown> | null }

  const supabase = createAdminClient()
  await garantirBucket(supabase)

  const path = `${escritorioId}/${membroId}.json`

  if (!subscription) {
    await supabase.storage.from(BUCKET).remove([path])
    return NextResponse.json({ sucesso: true })
  }

  const payload = JSON.stringify({
    membro_id: membroId,
    escritorio_id: escritorioId,
    subscription,
    atualizado_em: new Date().toISOString(),
  })

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, new Blob([payload], { type: 'application/json' }), {
      upsert: true,
      contentType: 'application/json',
    })

  if (error) {
    console.error('[Push] erro ao salvar subscrição:', error)
    return NextResponse.json({ erro: 'Erro ao salvar subscrição.' }, { status: 500 })
  }

  return NextResponse.json({ sucesso: true })
}
