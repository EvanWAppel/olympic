// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { config } from "dotenv"

config({ path: ".env.local" })

let getSettings: typeof import("../settings.repo").getSettings
let updateSettings: typeof import("../settings.repo").updateSettings
let db: typeof import("../client").db
let settings: typeof import("../schema").settings

let originalSnapshot: Awaited<ReturnType<typeof import("../settings.repo").getSettings>> | null = null

beforeAll(async () => {
  const repo = await import("../settings.repo")
  const client = await import("../client")
  const schema = await import("../schema")
  getSettings = repo.getSettings
  updateSettings = repo.updateSettings
  db = client.db
  settings = schema.settings
  originalSnapshot = await getSettings()
})

afterAll(async () => {
  if (originalSnapshot) {
    await db.update(settings).set({
      weightLb: originalSnapshot.weightLb,
      strideIn: originalSnapshot.strideIn,
      dailyStepGoal: originalSnapshot.dailyStepGoal,
      weeklyMilesGoal: originalSnapshot.weeklyMilesGoal,
      timezone: originalSnapshot.timezone,
    })
  }
})

describe("settings repo", () => {
  it("getSettings returns the singleton row with defaults if empty", async () => {
    const s = await getSettings()
    expect(s.singleton).toBe(true)
    expect(Number(s.weightLb)).toBeGreaterThan(0)
    expect(Number(s.strideIn)).toBeGreaterThan(0)
    expect(s.dailyStepGoal).toBeGreaterThan(0)
    expect(s.timezone).toBeDefined()
    expect(s.healthIngestSecret.length).toBeGreaterThan(8)
  })

  it("updateSettings persists changes and getSettings reflects them", async () => {
    await updateSettings({
      weightLb: "175",
      strideIn: "29",
      dailyStepGoal: 12_000,
      weeklyMilesGoal: "25",
      timezone: "America/Los_Angeles",
    })
    const after = await getSettings()
    expect(Number(after.weightLb)).toBe(175)
    expect(Number(after.strideIn)).toBe(29)
    expect(after.dailyStepGoal).toBe(12_000)
    expect(Number(after.weeklyMilesGoal)).toBe(25)
    expect(after.timezone).toBe("America/Los_Angeles")
  })

  it("calling getSettings twice returns the same row (singleton)", async () => {
    const a = await getSettings()
    const b = await getSettings()
    expect(a.singleton).toBe(b.singleton)
  })
})
