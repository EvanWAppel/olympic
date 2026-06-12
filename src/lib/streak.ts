export interface DailyStepsPoint {
  date: string // YYYY-MM-DD
  steps: number
}

function previousDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() - 1)
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`
}

export function computeStreak(days: DailyStepsPoint[], goal: number): number {
  if (days.length === 0) return 0
  const sorted = [...days].sort((a, b) => (a.date < b.date ? -1 : 1))
  let streak = 0
  let expectedDate: string | null = null
  for (let i = sorted.length - 1; i >= 0; i--) {
    const day = sorted[i]
    if (expectedDate && day.date !== expectedDate) break
    if (day.steps < goal) break
    streak++
    expectedDate = previousDate(day.date)
  }
  return streak
}
