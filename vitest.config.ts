import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

/**
 * Config de test isolée de `vite.config.ts` : on n'a pas besoin du plugin PWA
 * (Serwist) ni du build pour des tests de logique pure. On réplique juste
 * l'alias `@` → `src` pour résoudre les imports applicatifs.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
