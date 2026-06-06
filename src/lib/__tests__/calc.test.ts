import { describe, expect, it } from "vitest"
import { computeDistance, computeSteps, computeCalories } from "../calc"

describe("computeDistance", () => {
  it("returns speed * (minutes / 60)", () => {
    expect(computeDistance(3.5, 60)).toBeCloseTo(3.5, 5)
    expect(computeDistance(3.5, 45)).toBeCloseTo(2.625, 5)
    expect(computeDistance(4, 30)).toBeCloseTo(2, 5)
  })

  it("returns 0 when minutes is 0", () => {
    expect(computeDistance(3.5, 0)).toBe(0)
  })
})

describe("computeSteps", () => {
  it("computes steps as distance * (63360 / strideIn)", () => {
    // 30 in stride: 63360 / 30 = 2112 steps/mile
    expect(computeSteps(1, 30)).toBe(2112)
    expect(computeSteps(2.5, 30)).toBe(5280)
    // 28 in stride: 63360 / 28 = 2262.857… → 5657 for 2.5 mi
    expect(computeSteps(2.5, 28)).toBe(Math.round(2.5 * (63360 / 28)))
  })

  it("rounds to an integer", () => {
    const result = computeSteps(1.337, 27.5)
    expect(Number.isInteger(result)).toBe(true)
  })

  it("returns 0 for zero distance", () => {
    expect(computeSteps(0, 30)).toBe(0)
  })
})

describe("computeCalories (ACSM walking formula)", () => {
  // 3.5 mph, 0% incline, 30 min, 180 lb → ≈150 kcal
  it("matches a baseline flat walk", () => {
    expect(computeCalories(3.5, 0, 30, 180)).toBeCloseTo(150.3, 0)
  })

  // 4.0 mph, 5% incline, 60 min, 180 lb → ≈557 kcal
  it("accounts for incline (5%)", () => {
    expect(computeCalories(4.0, 5, 60, 180)).toBeCloseTo(557.2, 0)
  })

  // 3.0 mph, 0% incline, 45 min, 150 lb → ≈168 kcal
  it("scales with body weight and duration", () => {
    expect(computeCalories(3.0, 0, 45, 150)).toBeCloseTo(168.4, 0)
  })

  it("returns 0 for zero duration", () => {
    expect(computeCalories(3.5, 5, 0, 180)).toBe(0)
  })

  it("incline of 10% burns more than flat at same speed", () => {
    const flat = computeCalories(3.5, 0, 30, 180)
    const incline = computeCalories(3.5, 10, 30, 180)
    expect(incline).toBeGreaterThan(flat)
  })
})
