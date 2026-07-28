import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

/**
 * Tests de componentes y hooks (jsdom). No hay servidor de Next: los tests
 * montan los componentes de cliente directamente y simulan la API con el doble
 * de `@/lib/api` (ver src/test/harness.tsx).
 */
export default defineConfig({
  plugins: [react()],
  // Resuelve el alias @/ del tsconfig (nativo en Vite 8).
  resolve: { tsconfigPaths: true },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    css: false,
  },
});
