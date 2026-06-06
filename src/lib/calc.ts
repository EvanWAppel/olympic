const STEPS_PER_MILE_NUMERATOR = 63_360 // inches per mile
const METERS_PER_MILE_PER_MIN = 26.8224 // (m/min) per mph
const KG_PER_LB = 0.453592
const RESTING_VO2 = 3.5 // ml/kg/min

export function computeDistance(speedMph: number, minutes: number): number {
  return speedMph * (minutes / 60)
}

export function computeSteps(distanceMi: number, strideIn: number): number {
  if (distanceMi === 0) return 0
  return Math.round(distanceMi * (STEPS_PER_MILE_NUMERATOR / strideIn))
}

// ACSM walking formula:
//   VO2 (ml/kg/min) = 3.5 + 0.1 * (speed_m_per_min) + 1.8 * (speed_m_per_min) * grade
//   MET = VO2 / 3.5
//   kcal = MET * weight_kg * hours
export function computeCalories(
  speedMph: number,
  inclinePct: number,
  minutes: number,
  weightLb: number,
): number {
  if (minutes === 0) return 0
  const speedMPerMin = speedMph * METERS_PER_MILE_PER_MIN
  const grade = inclinePct / 100
  const vo2 = RESTING_VO2 + 0.1 * speedMPerMin + 1.8 * speedMPerMin * grade
  const met = vo2 / RESTING_VO2
  const weightKg = weightLb * KG_PER_LB
  const hours = minutes / 60
  return met * weightKg * hours
}
