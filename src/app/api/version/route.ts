import { NextResponse } from "next/server"

// Public, read-only: the git commit this build was made from (embedded by
// next.config.ts). Lets scripts/check-deploy-drift.mjs compare prod with main.
// Exposes nothing secret: the SHA is already public on GitHub.
export function GET() {
  const commit = process.env.BUILD_COMMIT || "unknown"
  return NextResponse.json({ commit }, { headers: { "Cache-Control": "no-store" } })
}
