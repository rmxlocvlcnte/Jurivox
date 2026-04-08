import { registrarRecusaAssinaturaPublica } from '@/lib/assinaturas-public'

export async function POST(
  req: Request,
  context: { params: Promise<{ hash: string }> }
) {
  const { hash } = await context.params
  const body = await req.json().catch(() => ({}))
  const motivo = typeof body?.motivo === 'string' ? body.motivo : null
  const result = await registrarRecusaAssinaturaPublica(hash, motivo, req)
  return Response.json(result.body, { status: result.status })
}
