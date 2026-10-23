// Resolves which git commit a build was made from, so the deployed app can
// report it on GET /api/version (deploy-drift check, DECISIONS 2026-10-10).
// Called from next.config.ts at build time; the result is inlined as
// process.env.BUILD_COMMIT.

const SHA_RE = /^[0-9a-f]{7,40}$/i

function asSha(value: string | null | undefined): string | null {
  const v = value?.trim()
  return v && SHA_RE.test(v) ? v.toLowerCase() : null
}

/**
 * Prefer the local `git rev-parse HEAD`; fall back to Vercel's
 * VERCEL_GIT_COMMIT_SHA (Vercel builds may not ship a .git dir); else "unknown".
 * Anything that isn't a hex SHA is rejected so the endpoint can't echo junk.
 */
export function resolveBuildCommit(
  gitHead: () => string | null,
  env: Record<string, string | undefined>,
): string {
  let fromGit: string | null = null
  try {
    fromGit = asSha(gitHead())
  } catch {
    fromGit = null
  }
  return fromGit ?? asSha(env.VERCEL_GIT_COMMIT_SHA) ?? "unknown"
}
