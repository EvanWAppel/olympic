import { config } from "dotenv"
import { Pool, neonConfig } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-serverless"
import { migrate } from "drizzle-orm/neon-serverless/migrator"
import ws from "ws"

config({ path: ".env.local" })

// Required for Node-side WebSocket connections.
neonConfig.webSocketConstructor = ws

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set")
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const db = drizzle({ client: pool })

  // Required for gen_random_bytes() used as a column default.
  await pool.query("CREATE EXTENSION IF NOT EXISTS pgcrypto")

  await migrate(db, { migrationsFolder: "./drizzle" })
  await pool.end()
  console.log("Migrations applied")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
