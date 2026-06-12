import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import path from "node:path"

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    css: false,
    // Tests share a single Postgres database; serialize file execution
    // to avoid races on the singleton settings row.
    pool: "forks",
    fileParallelism: false,
    ...({ forks: { singleFork: true } } as Record<string, unknown>),
    // DB tests run against a remote Neon branch; cold compute wake-ups and
    // network jitter can exceed the 5s/10s defaults.
    testTimeout: 20_000,
    hookTimeout: 30_000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
