import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { generateText } from 'ai'
import { legalModel } from '@/lib/ai'
import { MODOS } from '@/lib/ai-prompts'
import { rateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

export const maxDuration = 60

const Schema = z.object({
  tipo: z.enum(['mora', 'rescisao', 'cobranca', 'obrigacao', 'irregularidade']),
  notificante: z.string().min(2).max(300),
  notificado: z.string().min(2).max(300),
  fatos: z.string().min(20).max(5000),
  prazo: z.string().max(50).optional(),
  valor: z.string().max(100).optional(),
  fundamentoContratual: z.string().max(500).optional(),
})

const TIPO_LABEL: Record<string, string> = {
  mora: 'Constituição em Mora (art. 397, parágrafo único, CC)',
  rescisao: 'Rescisão Contratual (art. 473, CC)',
  cobranca: 'Cobrança de Dívida (art. 396, CC)',
  obrigacao: 'Cumprimento de Obrigação de Fazer',
  irregularidade: 'Notificação de Irregularidade',
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 })

  const rl = rateLimit(`ia:notificacao:${userId}`, { windowMs: 60_000, maxRequests: 5 })
  if (!rl.allowed) {
    return NextResponse.json({ erro: 'Muitas requisições. Aguarde um momento.' }, { status: 429 })
  }

  const body = await req.json()
  const parse = Schema.safeParse(body)
  if (!parse.success) {
    return NextResponse.json({ erro: parse.error.issues[0]?.message ?? 'Dados inválidos.' }, { status: 400 })
  }

  const { tipo, notificante, notificado, fatos, prazo, valor, fundamentoContratual } = parse.data

  const prompt = `Redija uma notificação extrajudicial com os seguintes dados:

TIPO: ${TIPO_LABEL[tipo]}
NOTIFICANTE: ${notificante}
NOTIFICADO: ${notificado}
${valor ? `VALOR: ${valor}` : ''}
${prazo ? `PRAZO SOLICITADO: ${prazo}` : ''}
${fundamentoContratual ? `FUNDAMENTO CONTRATUAL: ${fundamentoContratual}` : ''}

FATOS:
${fatos}

Siga a estrutura padrão de notificação extrajudicial brasileira.
Use a data de hoje (${new Date().toLocaleDateString('pt-BR')}) no cabeçalho.
Deixe [LOCAL] onde o usuário deve inserir o local de emissão.`

  try {
    const { text } = await generateText({
      model: legalModel,
      system: MODOS['notificacao'].systemPrompt,
      prompt,
    })

    return NextResponse.json({ notificacao: text })
  } catch (err) {
    console.error('[ia:notificacao] erro:', err)
    return NextResponse.json({ erro: 'Erro ao gerar notificação.' }, { status: 500 })
  }
}
