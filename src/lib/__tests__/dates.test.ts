import { describe, expect, it } from "vitest"
import { trailingYearStart } from "../dates"

describe("trailingYearStart", () => {
  it("is 364 days back on ordinary days", () => {
    expect(trailingYearStart("2026-10-10")).toBe("2025-10-11")
  })

  it("never starts after Jan 1, so year-to-date stays complete in a leap year", () => {
    // 2028-12-31 minus 364 days is 2028-01-02, which would drop Jan 1.
    expect(trailingYearStart("2028-12-31")).toBe("2028-01-01")
  })
})
