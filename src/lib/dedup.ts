export interface PhoneDailyTotals {
  steps: number
  distanceMi: number
  activeCalories: number
}

export interface TreadmillWorkoutSummary {
  steps: number | null
  distanceMi: number
  calories: number | null
}

export interface DedupInput {
  date: string
  phone: PhoneDailyTotals | null
  treadmillWorkouts: TreadmillWorkoutSummary[]
}

export interface DisplayedDay {
  date: string
  treadmillSteps: number
  outdoorSteps: number
  totalSteps: number
  treadmillDistanceMi: number
  outdoorDistanceMi: number
  totalDistanceMi: number
  treadmillCalories: number
  outdoorCalories: number
  totalCalories: number
}

export function displayedDailyTotals(input: DedupInput): DisplayedDay {
  const { date, phone, treadmillWorkouts } = input

  let treadmillSteps = 0
  let treadmillDistanceMi = 0
  let treadmillCalories = 0
  for (const w of treadmillWorkouts) {
    treadmillSteps += w.steps ?? 0
    treadmillDistanceMi += w.distanceMi
    treadmillCalories += w.calories ?? 0
  }

  const phoneSteps = phone?.steps ?? 0
  const phoneDistanceMi = phone?.distanceMi ?? 0
  const phoneCalories = phone?.activeCalories ?? 0

  const outdoorSteps = Math.max(0, phoneSteps - treadmillSteps)
  const outdoorDistanceMi = Math.max(0, phoneDistanceMi - treadmillDistanceMi)
  const outdoorCalories = Math.max(0, phoneCalories - treadmillCalories)

  return {
    date,
    treadmillSteps,
    outdoorSteps,
    totalSteps: treadmillSteps + outdoorSteps,
    treadmillDistanceMi,
    outdoorDistanceMi,
    totalDistanceMi: treadmillDistanceMi + outdoorDistanceMi,
    treadmillCalories,
    outdoorCalories,
    totalCalories: treadmillCalories + outdoorCalories,
  }
}
