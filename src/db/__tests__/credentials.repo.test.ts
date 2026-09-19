// @vitest-environment node
import { afterEach, beforeAll, describe, expect, it } from "vitest"
import { config } from "dotenv"

config({ path: ".env.local" })

let repo: typeof import("../credentials.repo")
let db: typeof import("../client").db
let webauthnCredential: typeof import("../schema").webauthnCredential
let inArray: typeof import("drizzle-orm").inArray

const createdIds: string[] = []

// Unique-but-recognizable id so cleanup is always scoped to rows this suite made.
function testId() {
  const id = `test-cred-${crypto.randomUUID()}`
  createdIds.push(id)
  return id
}

beforeAll(async () => {
  repo = await import("../credentials.repo")
  const client = await import("../client")
  const schema = await import("../schema")
  const orm = await import("drizzle-orm")
  db = client.db
  webauthnCredential = schema.webauthnCredential
  inArray = orm.inArray
})

afterEach(async () => {
  if (createdIds.length > 0) {
    await db
      .delete(webauthnCredential)
      .where(inArray(webauthnCredential.id, createdIds))
    createdIds.length = 0
  }
})

describe("credentials repo", () => {
  it("saveCredential inserts and returns the row with defaults", async () => {
    const id = testId()
    const row = await repo.saveCredential({
      id,
      publicKey: "cHVibGljLWtleQ", // base64url
      counter: 0,
      transports: ["internal", "hybrid"],
      deviceLabel: "iPhone",
    })

    expect(row.id).toBe(id)
    expect(row.publicKey).toBe("cHVibGljLWtleQ")
    expect(row.counter).toBe(0)
    expect(row.transports).toEqual(["internal", "hybrid"])
    expect(row.deviceLabel).toBe("iPhone")
    expect(row.createdAt).toBeInstanceOf(Date)
    expect(row.lastUsedAt).toBeNull()
  })

  it("saveCredential tolerates missing transports/deviceLabel", async () => {
    const id = testId()
    const row = await repo.saveCredential({
      id,
      publicKey: "a2V5",
      counter: 5,
    })
    expect(row.counter).toBe(5)
    expect(row.transports).toBeNull()
    expect(row.deviceLabel).toBeNull()
  })

  it("getCredentialById returns the row, or null when absent", async () => {
    const id = testId()
    await repo.saveCredential({ id, publicKey: "a2V5", counter: 0 })

    const found = await repo.getCredentialById(id)
    expect(found?.id).toBe(id)

    const missing = await repo.getCredentialById("test-cred-does-not-exist")
    expect(missing).toBeNull()
  })

  it("listCredentials includes saved rows", async () => {
    const a = testId()
    const b = testId()
    await repo.saveCredential({ id: a, publicKey: "a2V5", counter: 0 })
    await repo.saveCredential({ id: b, publicKey: "a2V5", counter: 0 })

    const all = await repo.listCredentials()
    const ids = all.map((c) => c.id)
    expect(ids).toContain(a)
    expect(ids).toContain(b)
  })

  it("countCredentials increases by the number of rows added", async () => {
    const before = await repo.countCredentials()
    await repo.saveCredential({ id: testId(), publicKey: "a2V5", counter: 0 })
    await repo.saveCredential({ id: testId(), publicKey: "a2V5", counter: 0 })
    const after = await repo.countCredentials()
    expect(after).toBe(before + 2)
  })

  it("updateCredentialCounter bumps the counter and stamps lastUsedAt", async () => {
    const id = testId()
    await repo.saveCredential({ id, publicKey: "a2V5", counter: 0 })

    await repo.updateCredentialCounter(id, 42)

    const after = await repo.getCredentialById(id)
    expect(after?.counter).toBe(42)
    expect(after?.lastUsedAt).toBeInstanceOf(Date)
  })

  it("deleteCredential removes the row", async () => {
    const id = testId()
    await repo.saveCredential({ id, publicKey: "a2V5", counter: 0 })

    await repo.deleteCredential(id)

    const after = await repo.getCredentialById(id)
    expect(after).toBeNull()
  })
})
