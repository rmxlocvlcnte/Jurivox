import { NextRequest, NextResponse } from 'next/server'
import { registrarEvento } from '@/lib/observabilidade'

const LIMITE_MENSAGEM = 3000

function truncar(valor: string | null | undefined, limite = LIMITE_MENSAGEM) {
  if (!valor) return ''
  return valor.slice(0, limite)
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      mensagem?: string
      stack?: string
      origem?: string
      url?: string
    }

    registrarEvento({
      nivel: 'error',
      origem: 'client-error',
      mensagem: truncar(body.mensagem) || 'Erro cliente sem mensagem',
      contexto: {
        origem: truncar(body.origem, 150),
        stack: truncar(body.stack),
        url: truncar(body.url, 500),
        ip: request.headers.get('x-forwarded-for') || '',
        userAgent: truncar(request.headers.get('user-agent'), 500),
      },
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
}

