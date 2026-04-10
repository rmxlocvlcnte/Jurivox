import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const BUCKET = 'push-subs'

// Endpoint interno para enviar notificações push a uma lista de membros
// Protegido por CRON_SECRET
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 })
  }

  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY
  const vapidSubject = process.env.VAPID_SUBJECT ?? 'mailto:contato@jurisflow.com.br'

  if (!vapidPublic || !vapidPrivate) {
    return NextResponse.json({ erro: 'VAPID não configurado.' }, { status: 503 })
  }

  const { membroIds, escritorioId, titulo, corpo, url } = await req.json() as {
    membroIds: string[]
    escritorioId: string
    titulo: string
    corpo: string
    url?: string
  }

  if (!membroIds?.length || !escritorioId || !titulo || !corpo) {
    return NextResponse.json({ erro: 'Campos obrigatórios: membroIds, escritorioId, titulo, corpo.' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Busca subscrições do Storage
  const subs: Array<{ endpoint: string; keys: { p256dh: string; auth: string } }> = []

  await Promise.allSettled(
    membroIds.map(async (membroId) => {
      const path = `${escritorioId}/${membroId}.json`
      const { data } = await supabase.storage.from(BUCKET).download(path)
      if (!data) return
      try {
        const text = await data.text()
        const parsed = JSON.parse(text)
        if (parsed.subscription?.endpoint) {
          subs.push(parsed.subscription as any)
        }
      } catch {}
    })
  )

  if (!subs.length) {
    return NextResponse.json({ enviados: 0 })
  }

  let webpush: typeof import('web-push')
  try {
    webpush = await import('web-push')
  } catch {
    return NextResponse.json({ erro: 'web-push não disponível.' }, { status: 503 })
  }

  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate)

  const payload = JSON.stringify({ title: titulo, body: corpo, url: url ?? '/dashboard' })

  let enviados = 0

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, payload)
        enviados++
      } catch (err: any) {
        if (err?.statusCode === 410) {
          // Subscrição expirada — remove do storage
          const path = subs.indexOf(sub).toString()
          await supabase.storage.from(BUCKET).remove([path])
        }
      }
    })
  )

  return NextResponse.json({ enviados })
}
