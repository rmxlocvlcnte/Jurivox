import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Endpoint interno (usado pelo cron ou server actions) para enviar push
// Protegido por CRON_SECRET
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 })
  }

  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY
  const vapidSubject = process.env.VAPID_SUBJECT ?? 'mailto:contato@jurivox.com.br'

  if (!vapidPublic || !vapidPrivate) {
    return NextResponse.json({ erro: 'VAPID não configurado.' }, { status: 503 })
  }

  const { membroIds, titulo, corpo, url } = await req.json() as {
    membroIds: string[]
    titulo: string
    corpo: string
    url?: string
  }

  if (!membroIds?.length || !titulo || !corpo) {
    return NextResponse.json({ erro: 'Campos obrigatórios: membroIds, titulo, corpo.' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .in('membro_id', membroIds)

  if (!subs?.length) {
    return NextResponse.json({ enviados: 0 })
  }

  // Importação dinâmica de web-push (apenas server-side)
  let webpush: typeof import('web-push')
  try {
    webpush = await import('web-push')
  } catch {
    return NextResponse.json({ erro: 'web-push não instalado. Execute: pnpm add web-push' }, { status: 503 })
  }

  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate)

  const payload = JSON.stringify({ title: titulo, body: corpo, url: url ?? '/dashboard' })

  let enviados = 0
  const falhas: string[] = []

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
        enviados++
      } catch (err: any) {
        // 410 = subscrição expirada, remove do banco
        if (err?.statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
        } else {
          falhas.push(sub.endpoint)
        }
      }
    })
  )

  return NextResponse.json({ enviados, falhas: falhas.length })
}
