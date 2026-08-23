import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  {
    settings: { react: { version: "19.2" } },
    rules: { "@next/next/no-html-link-for-pages": "off" },
  },
  globalIgnores([
    "**/node_modules/**",
    "**/.next/**",
    "**/coverage/**",
    "**/dist/**",
    "data/brand/source-manifest.json",
    "design-system/**",
  ]),
]);
