import { describe, expect, it } from "vitest"
import { LANDMARKS, describeDistance } from "../landmarks"

describe("LANDMARKS", () => {
  it("is sorted by distance, ascending, with positive distances", () => {
    const miles = LANDMARKS.map((l) => l.miles)
    expect(miles.every((m) => m > 0)).toBe(true)
    expect([...miles].sort((a, b) => a - b)).toEqual(miles)
  })
})

describe("describeDistance", () => {
  it("compares to the landmark closest in scale, as a share when short of it", () => {
    // 2000 mi: AT (2197) is ~0.91×, much closer in scale than the Camino (4×).
    expect(describeDistance(2000)).toBe("91% of the Appalachian Trail")
  })

  it("expresses multiples when past a landmark", () => {
    // 600 mi: Camino (500) at 1.2× beats Land's End (874) at 0.69×.
    expect(describeDistance(600)).toBe("1.2× the Camino de Santiago")
  })

  it("says 'the length of' when it rounds to exactly one", () => {
    expect(describeDistance(2190)).toBe("the length of the Appalachian Trail")
  })

  it("uses the smallest landmark for short distances", () => {
    expect(describeDistance(42)).toBe("50% of Hadrian's Wall Path")
  })

  it("returns null for zero or negative distance", () => {
    expect(describeDistance(0)).toBeNull()
    expect(describeDistance(-3)).toBeNull()
  })
})
