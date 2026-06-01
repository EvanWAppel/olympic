export interface DailyMiles {
  date: string
  miles: number
}

interface WorkoutLike {
  startAt: Date
  distanceMi: string | number
}

function localDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function aggregateDailyMiles(workouts: WorkoutLike[]): DailyMiles[] {
  const totals = new Map<string, number>()
  for (const w of workouts) {
    const key = localDateKey(w.startAt)
    const miles = typeof w.distanceMi === "number" ? w.distanceMi : Number(w.distanceMi)
    totals.set(key, (totals.get(key) ?? 0) + miles)
  }
  return Array.from(totals.entries())
    .map(([date, miles]) => ({ date, miles }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
}
