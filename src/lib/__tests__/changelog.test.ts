import { describe, expect, it } from "vitest"
import { MILESTONES } from "../changelog"

describe("MILESTONES", () => {
  it("is newest first", () => {
    const dates = MILESTONES.map((m) => m.date)
    expect([...dates].sort().reverse()).toEqual(dates)
  })

  it("uses valid ISO dates", () => {
    for (const m of MILESTONES) {
      expect(m.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(Number.isNaN(Date.parse(m.date))).toBe(false)
    }
  })

  it("has unique versions and non-empty item lists", () => {
    const versions = MILESTONES.flatMap((m) => (m.version ? [m.version] : []))
    expect(new Set(versions).size).toBe(versions.length)
    for (const m of MILESTONES) expect(m.items.length).toBeGreaterThan(0)
  })

  it("covers the milestones the PRD names (v1.0, v2.0-public, v3)", () => {
    const versions = MILESTONES.map((m) => m.version)
    expect(versions).toEqual(expect.arrayContaining(["v1.0", "v2.0-public", "v3"]))
  })
})
