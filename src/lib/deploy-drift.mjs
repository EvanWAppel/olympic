// Pure logic for scripts/check-deploy-drift.mjs: compares the commit a deploy
// reports on GET /api/version with origin/main. Plain ESM + JSDoc so the CLI
// runs under bare `node` and vitest can import it (fetch is injectable).

/** @typedef {{ status: "in-sync" | "drift" | "unknown", deployed: string, main: string }} Comparison */
/** @typedef {(url: string, init?: RequestInit) => Promise<Response>} FetchLike */

/** @param {string} s */
const norm = (s) => s.trim().toLowerCase()

/**
 * @param {string} deployed
 * @param {string} main
 * @returns {Comparison}
 */
export function compareCommits(deployed, main) {
  const d = norm(deployed)
  const m = norm(main)
  if (!d || d === "unknown") return { status: "unknown", deployed: d, main: m }
  return { status: d === m ? "in-sync" : "drift", deployed: d, main: m }
}

/**
 * @param {string} baseUrl
 * @param {FetchLike} [fetchImpl]
 * @returns {Promise<string>}
 */
export async function fetchDeployedCommit(baseUrl, fetchImpl = fetch) {
  const url = `${baseUrl.replace(/\/+$/, "")}/api/version`
  const res = await fetchImpl(url, { headers: { accept: "application/json" }, cache: "no-store" })
  if (!res.ok) throw new Error(`${url} returned HTTP ${res.status}`)
  const body = await res.json().catch(() => null)
  if (!body || typeof body.commit !== "string") {
    throw new Error(`${url} did not return a { commit } string`)
  }
  return body.commit
}

/** @param {string} sha */
const short = (sha) => sha.slice(0, 7)

/**
 * Exit codes: 0 in sync, 1 drift, 2 can't tell (unreachable, old build, no SHA).
 * @param {{ baseUrl: string, mainSha: string, fetchImpl?: FetchLike }} opts
 * @returns {Promise<{ exitCode: 0 | 1 | 2, message: string }>}
 */
export async function checkDeployDrift({ baseUrl, mainSha, fetchImpl = fetch }) {
  let deployed
  try {
    deployed = await fetchDeployedCommit(baseUrl, fetchImpl)
  } catch (err) {
    return {
      exitCode: 2,
      message: `Could not read the deployed commit: ${err instanceof Error ? err.message : err}`,
    }
  }
  const c = compareCommits(deployed, mainSha)
  if (c.status === "in-sync") {
    return { exitCode: 0, message: `In sync: ${baseUrl} is at origin/main (${short(c.main)}).` }
  }
  if (c.status === "unknown") {
    return {
      exitCode: 2,
      message: `${baseUrl} reports no build commit; origin/main is ${short(c.main)}.`,
    }
  }
  return {
    exitCode: 1,
    message: `DRIFT: ${baseUrl} is at ${short(c.deployed)} but origin/main is ${short(c.main)}.`,
  }
}
