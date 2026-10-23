#!/usr/bin/env node
// Compares the commit a deploy reports on GET /api/version with origin/main.
//
//   node scripts/check-deploy-drift.mjs https://olympic.evanappel.me
//
// Run `git fetch origin` first so origin/main is current.
// Exit codes: 0 in sync, 1 drift, 2 can't tell (unreachable, pre-/api/version
// build, or no embedded commit). Read-only: it never deploys anything.
import { execFileSync } from "node:child_process"
import { checkDeployDrift } from "../src/lib/deploy-drift.mjs"

const baseUrl = process.argv[2]
if (!baseUrl) {
  console.error("usage: node scripts/check-deploy-drift.mjs <base-url>")
  process.exit(64)
}

let mainSha
try {
  mainSha = execFileSync("git", ["rev-parse", "origin/main"], { encoding: "utf-8" }).trim()
} catch {
  console.error("Could not resolve origin/main (run inside the repo, after `git fetch origin`).")
  process.exit(2)
}

const { exitCode, message } = await checkDeployDrift({ baseUrl, mainSha })
;(exitCode === 0 ? console.log : console.error)(message)
process.exit(exitCode)
