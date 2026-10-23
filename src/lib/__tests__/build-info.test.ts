import { describe, expect, it } from "vitest"
import { resolveBuildCommit } from "@/lib/build-info"

const SHA = "0123456789abcdef0123456789abcdef01234567"
const VERCEL_SHA = "fedcba9876543210fedcba9876543210fedcba98"

describe("resolveBuildCommit", () => {
  it("prefers the local git HEAD", () => {
    expect(resolveBuildCommit(() => `${SHA}\n`, { VERCEL_GIT_COMMIT_SHA: VERCEL_SHA })).toBe(SHA)
  })

  it("falls back to VERCEL_GIT_COMMIT_SHA when git is unavailable", () => {
    const noGit = () => {
      throw new Error("not a git repository")
    }
    expect(resolveBuildCommit(noGit, { VERCEL_GIT_COMMIT_SHA: VERCEL_SHA })).toBe(VERCEL_SHA)
  })

  it("falls back when git returns something that isn't a SHA", () => {
    expect(resolveBuildCommit(() => "", { VERCEL_GIT_COMMIT_SHA: VERCEL_SHA })).toBe(VERCEL_SHA)
  })

  it("returns 'unknown' when neither source has a SHA", () => {
    expect(resolveBuildCommit(() => "", {})).toBe("unknown")
  })

  it("rejects a malformed env value rather than echoing it", () => {
    expect(resolveBuildCommit(() => "", { VERCEL_GIT_COMMIT_SHA: "not-a-sha; rm -rf" })).toBe(
      "unknown",
    )
  })
})
