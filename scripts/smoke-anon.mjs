#!/usr/bin/env node
// Anonymous smoke probe: every public route must answer 200 (or its expected
// redirect) and every private route 401/403/307, with no cookies sent.
//
//   node scripts/smoke-anon.mjs http://localhost:3000
//
// The route table lives in src/lib/smoke-routes.mjs and a unit test keeps it in
// step with src/app. Exit codes: 0 all pass, 1 any mismatch, 64 usage.
// Requests are read-only in effect (empty/invalid bodies, no confirm headers),
// but prod runs are Evan's call: run it against a local prod build by default.
import { runSmoke } from "../src/lib/smoke-routes.mjs"

const baseUrl = process.argv[2]
if (!baseUrl) {
  console.error("usage: node scripts/smoke-anon.mjs <base-url>")
  process.exit(64)
}

const { exitCode, lines } = await runSmoke({ baseUrl })
for (const line of lines) (line.startsWith("FAIL") ? console.error : console.log)(line)
process.exit(exitCode)
