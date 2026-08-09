export interface DailyMilesPoint {
  date: string // YYYY-MM-DD
  miles: number
}

export interface WeekMiles {
  weekStart: string // Monday YYYY-MM-DD
  miles: number
}

export function isoWeekStart(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  // getUTCDay: Sunday=0..Saturday=6. Shift so Monday=0.
  const dow = (date.getUTCDay() + 6) % 7
  date.setUTCDate(date.getUTCDate() - dow)
  const yy = date.getUTCFullYear()
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0")
  const dd = String(date.getUTCDate()).padStart(2, "0")
  return `${yy}-${mm}-${dd}`
}

export function bucketByWeek(days: DailyMilesPoint[]): WeekMiles[] {
  if (days.length === 0) return []
  const totals = new Map<string, number>()
  for (const d of days) {
    const wk = isoWeekStart(d.date)
    totals.set(wk, (totals.get(wk) ?? 0) + d.miles)
  }
  return Array.from(totals.entries())
    .map(([weekStart, miles]) => ({ weekStart, miles }))
    .sort((a, b) => (a.weekStart < b.weekStart ? -1 : 1))
}

export interface TreadmillWeekInput {
  date: string // YYYY-MM-DD
  speedMph: number | null
  inclinePct: number | null
}

export interface PaceInclineWeek {
  weekStart: string
  avgSpeedMph: number | null
  avgInclinePct: number | null
}

export function bucketPaceIncline(
  workouts: TreadmillWeekInput[],
): PaceInclineWeek[] {
  const buckets = new Map<string, { speeds: number[]; inclines: number[] }>()
  for (const w of workouts) {
    const wk = isoWeekStart(w.date)
    let bucket = buckets.get(wk)
    if (!bucket) {
      bucket = { speeds: [], inclines: [] }
      buckets.set(wk, bucket)
    }
    if (w.speedMph !== null) bucket.speeds.push(w.speedMph)
    if (w.inclinePct !== null) bucket.inclines.push(w.inclinePct)
  }
  const mean = (xs: number[]) =>
    xs.length === 0 ? null : xs.reduce((a, b) => a + b, 0) / xs.length
  return Array.from(buckets.entries())
    .map(([weekStart, { speeds, inclines }]) => ({
      weekStart,
      avgSpeedMph: mean(speeds),
      avgInclinePct: mean(inclines),
    }))
    .sort((a, b) => (a.weekStart < b.weekStart ? -1 : 1))
}

export function rollingAverage<T extends { x: string }>(
  series: T[],
  window: number,
  key: keyof T,
): Array<{ x: string; avg: number | null }> {
  return series.map((point, i) => {
    if (i + 1 < window) {
      return { x: point.x, avg: null }
    }
    let sum = 0
    for (let j = i - window + 1; j <= i; j++) {
      sum += Number(series[j][key])
    }
    return { x: point.x, avg: sum / window }
  })
}
