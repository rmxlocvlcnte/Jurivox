import { streamText } from "ai";
import { legalModel } from "@/lib/ai";

export const maxDuration = 60;

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();

        const result = await streamText({
            model: legalModel,
            messages,
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