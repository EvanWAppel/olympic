import { config } from "dotenv"
import { Pool, neonConfig } from "@neondatabase/serverless"
import ws from "ws"

config({ path: ".env.local" })
neonConfig.webSocketConstructor = ws

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set")
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  await pool.query(`DROP TYPE IF EXISTS "public"."workout_source" CASCADE`)
  await pool.query(`DROP TABLE IF EXISTS "settings" CASCADE`)
  await pool.query(`DROP TABLE IF EXISTS "daily_metric" CASCADE`)
  await pool.end()
  console.log("Orphan objects dropped")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
