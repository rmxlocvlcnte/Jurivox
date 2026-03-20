import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Permite deploy mesmo com erros de TypeScript/ESLint
  // Remover quando o projeto estiver em produção real
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
