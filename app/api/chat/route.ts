import { streamText } from "ai";
import { legalModel } from "@/lib/ai";
import { auth } from "@clerk/nextjs/server";

export const maxDuration = 60;

// Rate limiting simples em memória: userId → { count, windowStart }
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();
const WINDOW_MS = 60_000;   // janela de 1 minuto
const MAX_REQUESTS = 15;    // máx 15 requisições por minuto por usuário

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    rateLimitMap.set(userId, { count: 1, windowStart: now });
    return true;
  }

  if (entry.count >= MAX_REQUESTS) return false;

  entry.count++;
  return true;
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new Response("Não autorizado", { status: 401 });
  }

  // Rate limiting
  if (!checkRateLimit(userId)) {
    return new Response(
      JSON.stringify({ error: "Muitas requisições. Aguarde um momento." }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();
    const messages = body?.messages;

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response("Mensagens inválidas", { status: 400 });
    }

    // Limita histórico (máx 30 mensagens) e tamanho de cada mensagem (máx 8000 chars)
    const messagesLimitados = messages
      .slice(-30)
      .map((m: any) => ({
        ...m,
        content: typeof m.content === "string"
          ? m.content.slice(0, 8000)
          : m.content,
      }));

    const result = await streamText({
      model: legalModel,
      messages: messagesLimitados,
      system: `Você é um Desembargador Brasileiro Sênior.
            Sua linguagem deve ser formal, técnica e baseada no CPC/2015 e na Constituição Federal.
            Ao analisar textos:
            1. Identifique contradições lógicas entre fatos e provas.
            2. Cite artigos de lei relevantes para embasar a análise.
            3. Se o usuário fornecer um trecho de depoimento, verifique a verossimilhança.
            Nunca invente números de processos ou leis que não existem.`,
    });

    return (result as any).toDataStreamResponse();
  } catch (error) {
    console.error("Erro na rota do chat:", error);
    return new Response("Erro interno", { status: 500 });
  }
}
