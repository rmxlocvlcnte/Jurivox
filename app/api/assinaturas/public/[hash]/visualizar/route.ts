import { registrarVisualizacaoAssinatura } from '@/lib/assinaturas-public'

export async function POST(
  req: Request,
  context: { params: Promise<{ hash: string }> }
) {
  const { hash } = await context.params
  const result = await registrarVisualizacaoAssinatura(hash, req)
  return Response.json(result.body, { status: result.status })
}
