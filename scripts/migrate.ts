import { config } from "dotenv"
import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import { migrate } from "drizzle-orm/neon-http/migrator"

config({ path: ".env.local" })

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set")
  }

  const sql = neon(process.env.DATABASE_URL)
  const db = drizzle({ client: sql })

  await migrate(db, { migrationsFolder: "./drizzle" })
  console.log("Migrations applied")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
