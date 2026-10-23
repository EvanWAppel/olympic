import { describe, expect, it, vi } from "vitest"
import { checkDeployDrift, compareCommits, fetchDeployedCommit } from "@/lib/deploy-drift.mjs"

const A = "0123456789abcdef0123456789abcdef01234567"
const B = "fedcba9876543210fedcba9876543210fedcba98"

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  })
}

describe("compareCommits", () => {
  it("is in sync when the SHAs match", () => {
    expect(compareCommits(A, A)).toEqual({ status: "in-sync", deployed: A, main: A })
  })

  it("ignores case and surrounding whitespace", () => {
    expect(compareCommits(A.toUpperCase(), ` ${A}\n`).status).toBe("in-sync")
  })

  it("reports drift when the SHAs differ", () => {
    expect(compareCommits(A, B)).toEqual({ status: "drift", deployed: A, main: B })
  })

  it("reports unknown when the deploy has no embedded commit", () => {
    expect(compareCommits("unknown", B).status).toBe("unknown")
  })
})

describe("fetchDeployedCommit", () => {
  it("GETs <base>/api/version and returns the commit", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ commit: A }))
    await expect(fetchDeployedCommit("https://example.test/", fetchImpl)).resolves.toBe(A)
    expect(fetchImpl).toHaveBeenCalledWith("https://example.test/api/version", expect.anything())
  })

  it("throws on a non-200 response", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ error: "nope" }, 404))
    await expect(fetchDeployedCommit("https://example.test", fetchImpl)).rejects.toThrow(/404/)
  })

  it("throws when the body has no commit string", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ hello: "world" }))
    await expect(fetchDeployedCommit("https://example.test", fetchImpl)).rejects.toThrow(/commit/)
  })
})

describe("checkDeployDrift", () => {
  it("exits 0 when prod matches origin/main", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ commit: A }))
    const r = await checkDeployDrift({ baseUrl: "https://x.test", mainSha: A, fetchImpl })
    expect(r.exitCode).toBe(0)
    expect(r.message).toMatch(/in sync/i)
  })

  it("exits 1 and names both SHAs on drift", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ commit: A }))
    const r = await checkDeployDrift({ baseUrl: "https://x.test", mainSha: B, fetchImpl })
    expect(r.exitCode).toBe(1)
    expect(r.message).toContain(A.slice(0, 7))
    expect(r.message).toContain(B.slice(0, 7))
  })

  it("exits 2 when the deploy can't be read (e.g. pre-/api/version build)", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({}, 404))
    const r = await checkDeployDrift({ baseUrl: "https://x.test", mainSha: B, fetchImpl })
    expect(r.exitCode).toBe(2)
  })

  it("exits 2 when the deploy reports an unknown commit", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ commit: "unknown" }))
    const r = await checkDeployDrift({ baseUrl: "https://x.test", mainSha: B, fetchImpl })
    expect(r.exitCode).toBe(2)
  })
})
