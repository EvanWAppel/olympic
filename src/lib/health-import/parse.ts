import sax from "sax"

const KM_TO_MI = 0.621371

export interface ParsedDailyMetric {
  date: string
  steps: number
  distanceMi: number
  activeCalories: number
}

export interface ParsedWorkout {
  externalId: string
  startAt: Date
  endAt: Date
  minutes: number
  distanceMi: number
  calories: number
}

export interface ParsedExport {
  dailyMetrics: ParsedDailyMetric[]
  workouts: ParsedWorkout[]
}

function localDateKey(d: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d)
  const y = parts.find((p) => p.type === "year")?.value ?? "0000"
  const m = parts.find((p) => p.type === "month")?.value ?? "00"
  const day = parts.find((p) => p.type === "day")?.value ?? "00"
  return `${y}-${m}-${day}`
}

// Apple Health date strings look like "2026-05-29 06:00:00 -0500".
// `Date` accepts ISO 8601 with `T` and explicit offset, so reshape.
function parseAppleDate(s: string): Date {
  const iso = s.replace(" ", "T").replace(/ ([+-]\d{2})(\d{2})$/, "$1:$2")
  return new Date(iso)
}

function toMiles(value: number, unit: string | undefined): number {
  if (!unit) return value
  const u = unit.toLowerCase()
  if (u === "mi" || u === "miles") return value
  if (u === "km") return value * KM_TO_MI
  if (u === "m") return value * 0.000621371
  return value
}

function toKcal(value: number, unit: string | undefined): number {
  if (!unit) return value
  const u = unit.toLowerCase()
  if (u === "kcal" || u === "cal" || u === "kilocalorie") return value
  if (u === "j") return value / 4184
  return value
}

export async function parseHealthExport(
  xml: string,
  timezone: string,
): Promise<ParsedExport> {
  const dailyMetrics = new Map<
    string,
    { steps: number; distanceMi: number; activeCalories: number }
  >()
  const workouts: ParsedWorkout[] = []

  let currentWorkout: ParsedWorkout | null = null

  const parser = sax.parser(true, { trim: true, normalize: true })

  parser.onopentag = (node) => {
    const attrs = node.attributes as Record<string, string>
    const name = node.name

    if (name === "Record") {
      const type = attrs.type
      const startDate = attrs.startDate
      if (!type || !startDate) return
      const value = Number(attrs.value)
      if (!Number.isFinite(value)) return
      const key = localDateKey(parseAppleDate(startDate), timezone)
      const existing = dailyMetrics.get(key) ?? {
        steps: 0,
        distanceMi: 0,
        activeCalories: 0,
      }
      if (type === "HKQuantityTypeIdentifierStepCount") {
        existing.steps += value
        dailyMetrics.set(key, existing)
      } else if (type === "HKQuantityTypeIdentifierDistanceWalkingRunning") {
        existing.distanceMi += toMiles(value, attrs.unit)
        dailyMetrics.set(key, existing)
      } else if (type === "HKQuantityTypeIdentifierActiveEnergyBurned") {
        existing.activeCalories += toKcal(value, attrs.unit)
        dailyMetrics.set(key, existing)
      }
    } else if (name === "Workout") {
      const activity = attrs.workoutActivityType
      if (activity !== "HKWorkoutActivityTypeWalking") {
        currentWorkout = null
        return
      }
      const startDate = attrs.startDate
      const endDate = attrs.endDate
      if (!startDate || !endDate) return
      const startAt = parseAppleDate(startDate)
      const endAt = parseAppleDate(endDate)
      const explicitMinutes = Number(attrs.duration)
      const minutes = Number.isFinite(explicitMinutes)
        ? attrs.durationUnit === "hr" || attrs.durationUnit === "hour"
          ? explicitMinutes * 60
          : explicitMinutes
        : (endAt.getTime() - startAt.getTime()) / 60_000
      const distanceMi = toMiles(
        Number(attrs.totalDistance) || 0,
        attrs.totalDistanceUnit,
      )
      const calories = toKcal(
        Number(attrs.totalEnergyBurned) || 0,
        attrs.totalEnergyBurnedUnit,
      )
      currentWorkout = {
        externalId: "",
        startAt,
        endAt,
        minutes,
        distanceMi,
        calories,
      }
    } else if (name === "MetadataEntry" && currentWorkout) {
      if (attrs.key === "HKExternalUUID" && attrs.value) {
        currentWorkout.externalId = attrs.value
      }
    }
  }

  parser.onclosetag = (name) => {
    if (name === "Workout") {
      if (currentWorkout && currentWorkout.externalId) {
        workouts.push(currentWorkout)
      }
      currentWorkout = null
    }
  }

  let parseError: Error | null = null
  parser.onerror = (err) => {
    parseError = err
  }

  parser.write(xml).close()
  if (parseError) throw parseError

  return {
    dailyMetrics: Array.from(dailyMetrics.entries())
      .map(([date, m]) => ({ date, ...m }))
      .sort((a, b) => (a.date < b.date ? -1 : 1)),
    workouts,
  }
}
