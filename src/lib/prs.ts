export interface WorkoutForPR {
  source: "treadmill" | "outdoor"
  minutes: number
  speedMph: number | null
  date: string // YYYY-MM-DD local date the workout happened
}

export interface DailyStepsPoint {
  date: string
  steps: number
}

export interface PRs {
  longestWalkMinutes: { minutes: number; setAt: string } | null
  fastestAvgSpeedMph: { speedMph: number; setAt: string } | null
  mostStepsDay: { steps: number; setAt: string } | null
  longestStreak: { days: number; setAt: string } | null
}

function longestStreak(
  days: DailyStepsPoint[],
  goal: number,
): { days: number; setAt: string } | null {
  if (days.length === 0) return null
  const sorted = [...days].sort((a, b) => (a.date < b.date ? -1 : 1))
  let best = 0
  let bestEnd: string | null = null
  let current = 0
  let prevDate: string | null = null
  for (const day of sorted) {
    const consecutive =
      prevDate !== null &&
      (() => {
        const [py, pm, pd] = prevDate!.split("-").map(Number)
        const dt = new Date(Date.UTC(py, pm - 1, pd))
        dt.setUTCDate(dt.getUTCDate() + 1)
        const expected = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`
        return day.date === expected
      })()
    if (day.steps >= goal) {
      current = consecutive ? current + 1 : 1
      if (current > best) {
        best = current
        bestEnd = day.date
      }
    } else {
      current = 0
    }
    prevDate = day.date
  }
  return best > 0 && bestEnd ? { days: best, setAt: bestEnd } : null
}

export function computePRs(input: {
  workouts: WorkoutForPR[]
  dailySteps: DailyStepsPoint[]
  goal: number
}): PRs {
  const longestWalk = input.workouts.reduce<WorkoutForPR | null>(
    (best, w) => (best && best.minutes >= w.minutes ? best : w),
    null,
  )

  const treadmillWithSpeed = input.workouts.filter(
    (w): w is WorkoutForPR & { speedMph: number } =>
      w.source === "treadmill" && w.speedMph !== null,
  )
  const fastest = treadmillWithSpeed.reduce<(WorkoutForPR & { speedMph: number }) | null>(
    (best, w) => (best && best.speedMph >= w.speedMph ? best : w),
    null,
  )

  const mostSteps = input.dailySteps.reduce<DailyStepsPoint | null>(
    (best, d) => (best && best.steps >= d.steps ? best : d),
    null,
  )

  return {
    longestWalkMinutes: longestWalk
      ? { minutes: longestWalk.minutes, setAt: longestWalk.date }
      : null,
    fastestAvgSpeedMph: fastest
      ? { speedMph: fastest.speedMph, setAt: fastest.date }
      : null,
    mostStepsDay: mostSteps
      ? { steps: mostSteps.steps, setAt: mostSteps.date }
      : null,
    longestStreak: longestStreak(input.dailySteps, input.goal),
  }
}
