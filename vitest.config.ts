import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      include: [
        'lib/utils/**/*.ts',
        'lib/permissoes.ts',
        'lib/limites.ts',
        'lib/sqa.ts',
        'lib/observabilidade.ts',
        'lib/audit.ts',
        'lib/rate-limit.ts',
      ],
      // Limites mínimos de cobertura (ISO 9001 — eficácia do controle de qualidade)
      thresholds: {
        lines:      70,
        functions:  70,
        branches:   60,
        statements: 70,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
