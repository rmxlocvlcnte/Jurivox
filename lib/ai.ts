import { createOpenAI } from "@ai-sdk/openai";

// Configurando provedor deepseek

export const deepseekProvedor = createOpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: 'https://api.deepseek.com',
});

// Exportando modelo R1 (Lógico)
export const legalModel = deepseekProvedor('deepseek-reasoner');
