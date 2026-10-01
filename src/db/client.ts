import { neon, neonConfig } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import * as schema from "./schema"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set")
}

// When NEON_LOCAL_PROXY_URL is set (local dev / CI against the
// docker-compose.test.yml stack), route the HTTP driver at the local Neon
// proxy. Guarded by the env var, so a real Neon host is never affected.
if (process.env.NEON_LOCAL_PROXY_URL) {
  neonConfig.fetchEndpoint = () => process.env.NEON_LOCAL_PROXY_URL as string
}

const sql = neon(process.env.DATABASE_URL)

export const db = drizzle({ client: sql, schema })
