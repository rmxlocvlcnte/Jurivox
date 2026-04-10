import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

// Salva ou remove a subscrição Web Push de um usuário
export async function POST(req: NextRequest) {
  const { membroId, escritorioId } = await getAuthContext()
  if (!membroId || !escritorioId) {
    return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })
  }

  const body = await req.json()
  const { subscription } = body as { subscription: PushSubscription | null }

  const supabase = createAdminClient()

  if (!subscription) {
    // Remover subscrição
    await supabase
      .from('push_subscriptions')
      .delete()
      .eq('membro_id', membroId)
    return NextResponse.json({ sucesso: true })
  }

  // Upsert da subscrição
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(
      {
        membro_id: membroId,
        escritorio_id: escritorioId,
        endpoint: (subscription as any).endpoint,
        p256dh: (subscription as any).keys?.p256dh ?? null,
        auth: (subscription as any).keys?.auth ?? null,
        atualizado_em: new Date().toISOString(),
      },
      { onConflict: 'membro_id' }
    )

  if (error) {
    console.error('[Push] erro ao salvar subscrição:', error)
    return NextResponse.json({ erro: 'Erro ao salvar subscrição.' }, { status: 500 })
  }

  return NextResponse.json({ sucesso: true })
}
