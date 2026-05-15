import { streamText } from "ai";
import { legalModel } from "@/lib/ai";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { obterSystemPrompt, type ModoIA } from "@/lib/ai-prompts";

export const maxDuration = 60;

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 15;

async function checkRateLimit(userId: string): Promise<boolean> {
  const supabase = createAdminClient();
  const now = Date.now();

  const { data, error } = await supabase
    .from('rate_limits')
    .select('id, count, window_start')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('[RateLimit] erro ao consultar:', error.message);
    return true;
  }

  if (!data) {
    await supabase.from('rate_limits').insert({
      user_id: userId,
      count: 1,
      window_start: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    return true;
  }

  const windowStart = new Date(data.window_start).getTime();
  if (now - windowStart > WINDOW_MS) {
    await supabase
      .from('rate_limits')
      .update({ count: 1, window_start: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', data.id);
    return true;
  }

  if (data.count >= MAX_REQUESTS) return false;

  await supabase
    .from('rate_limits')
    .update({ count: data.count + 1, updated_at: new Date().toISOString() })
    .eq('id', data.id);

  return true;
}

function normalizarMensagens(mensagens: any[]): { role: string; content: string }[] {
  return mensagens.map((m: any) => {
    if (typeof m.content === 'string') {
      return { role: m.role, content: m.content.slice(0, 8000) }
    }
    const texto = Array.isArray(m.parts)
      ? m.parts
          .filter((p: any) => p.type === 'text')
          .map((p: any) => p.text ?? '')
          .join('')
      : ''
    return { role: m.role, content: texto.slice(0, 8000) }
  })
}

const MODOS_VALIDOS: ModoIA[] = [
  'geral', 'redacao-peca', 'notificacao', 'analise-contrato',
  'preparacao-audiencia', 'cronologia', 'lgpd', 'analise-risco',
]

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new Response("Não autorizado", { status: 401 });
  }

  const rl = rateLimit(`chat:${userId}`, { windowMs: WINDOW_MS, maxRequests: MAX_REQUESTS });
  if (!rl.allowed) {
    return new Response(
      JSON.stringify({ error: "Muitas requisições. Aguarde um momento." }),
      { status: 429, headers: { "Content-Type": "application/json", "X-RateLimit-Reset": String(rl.resetAt) } }
    );
  }

  if (!(await checkRateLimit(userId))) {
    return new Response(
      JSON.stringify({ error: "Muitas requisições. Aguarde um momento." }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();
    const mensagensRaw = body?.messages;
    const modoRaw = body?.mode as string;

    if (!Array.isArray(mensagensRaw) || mensagensRaw.length === 0) {
      return new Response("Mensagens inválidas", { status: 400 });
    }

    const modo: ModoIA = MODOS_VALIDOS.includes(modoRaw as ModoIA)
      ? (modoRaw as ModoIA)
      : 'geral';

    const messages = normalizarMensagens(mensagensRaw.slice(-30)) as any[];
    const systemPrompt = obterSystemPrompt(modo);

    const result = await streamText({
      model: legalModel,
      messages,
      system: systemPrompt,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Erro na rota do chat:", error);
    return new Response("Erro interno", { status: 500 });
  }
}
