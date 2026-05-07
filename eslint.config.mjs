import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // ── Qualidade de código (SQA — Padrão VPS: violação de padrões) ──────
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["error", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      }],
      "@typescript-eslint/no-floating-promises": "off",
      "prefer-const": "error",
      "no-var": "error",
      "no-duplicate-imports": "error",
      "eqeqeq": ["error", "always", { null: "ignore" }],

      // ── Segurança (SQA — Administração da segurança) ─────────────────────
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",

      // ── Observabilidade (usar registrarEvento em vez de console.log) ─────
      "no-console": ["warn", { allow: ["error", "warn"] }],

      // ── Integridade de interface (SQA — ICI: interface inconsistente) ────
      "@next/next/no-html-link-for-pages": "warn",
      "react/no-unescaped-entities": "warn",
      "react-hooks/rules-of-hooks": "error",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "Jurisflow/**",
  ]),
]);

export default eslintConfig;
