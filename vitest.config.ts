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
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
