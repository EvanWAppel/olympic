// @vitest-environment node
import { afterEach, beforeAll, describe, expect, it } from "vitest"
import { config } from "dotenv"

config({ path: ".env.local" })

let repo: typeof import("../challenges.repo")
let db: typeof import("../client").db
let webauthnChallenge: typeof import("../schema").webauthnChallenge
let inArray: typeof import("drizzle-orm").inArray

const createdChallenges: string[] = []

function testChallenge() {
  const c = `test-chal-${crypto.randomUUID()}`
  createdChallenges.push(c)
  return c
}

beforeAll(async () => {
  repo = await import("../challenges.repo")
  const client = await import("../client")
  const schema = await import("../schema")
  const orm = await import("drizzle-orm")
  db = client.db
  webauthnChallenge = schema.webauthnChallenge
  inArray = orm.inArray
})

afterEach(async () => {
  if (createdChallenges.length > 0) {
    await db
      .delete(webauthnChallenge)
      .where(inArray(webauthnChallenge.challenge, createdChallenges))
    createdChallenges.length = 0
  }
})

describe("challenges repo", () => {
  it("createChallenge then consumeChallenge returns the value once (single-use)", async () => {
    const challenge = testChallenge()
    await repo.createChallenge({ challenge, type: "registration" })

    const first = await repo.consumeChallenge("registration")
    expect(first).toBe(challenge)

    // Second consume finds nothing — it was deleted on read.
    const second = await repo.consumeChallenge("registration")
    expect(second).toBeNull()
  })

  it("consumeChallenge rejects an expired challenge (returns null)", async () => {
    const challenge = testChallenge()
    await repo.createChallenge({ challenge, type: "authentication", ttlMs: -1000 })

    const result = await repo.consumeChallenge("authentication")
    expect(result).toBeNull()
  })

  it("consumeChallenge isolates by type", async () => {
    const reg = testChallenge()
    await repo.createChallenge({ challenge: reg, type: "registration" })

    // Wrong type finds nothing and leaves the registration challenge intact.
    expect(await repo.consumeChallenge("authentication")).toBeNull()
    expect(await repo.consumeChallenge("registration")).toBe(reg)
  })

  it("consumeChallenge returns the latest pending challenge of a type", async () => {
    const older = testChallenge()
    const newer = testChallenge()
    await repo.createChallenge({ challenge: older, type: "registration", ttlMs: 60_000 })
    await repo.createChallenge({ challenge: newer, type: "registration", ttlMs: 120_000 })

    expect(await repo.consumeChallenge("registration")).toBe(newer)
    // Consuming also clears the stale one, so nothing remains.
    expect(await repo.consumeChallenge("registration")).toBeNull()
  })
})
