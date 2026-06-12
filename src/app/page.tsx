import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { listWorkouts } from "@/db/workouts.repo"
import { getSettings } from "@/db/settings.repo"
import { getDailyTotalsRange } from "@/db/totals.repo"
import { addDays, localDateKey } from "@/lib/dates"
import { computeStreak } from "@/lib/streak"
import { computePRs } from "@/lib/prs"
import { bucketByWeek, bucketPaceIncline } from "@/lib/chart-data"
import { TodayCard } from "@/components/cards/today-card"
import { StreakCard } from "@/components/cards/streak-card"
import { WeekCard } from "@/components/cards/week-card"
import { YtdCard } from "@/components/cards/ytd-card"
import { PrsPanel } from "@/components/cards/prs-panel"
import { DailyStepsBar } from "@/components/charts/daily-steps-bar"
import { WeeklyMilesLine } from "@/components/charts/weekly-miles-line"
import { YearHeatmap } from "@/components/charts/year-heatmap"
import { PaceInclineTrend } from "@/components/charts/pace-incline-trend"
import { EntryFormIsland } from "@/components/entry-form-island"
import { WorkoutList } from "@/components/workout-list"

export const dynamic = "force-dynamic"

export default async function Home() {
  const s = await getSettings()
  const timezone = s.timezone
  const today = localDateKey(new Date(), timezone)
  const yearStart = `${today.slice(0, 4)}-01-01`
  const rangeStart = addDays(today, -364)

  const [totals, workouts] = await Promise.all([
    getDailyTotalsRange({ startDate: rangeStart, endDate: today, timezone }),
    listWorkouts(),
  ])

  const settings = {
    weightLb: Number(s.weightLb),
    strideIn: Number(s.strideIn),
  }
  const stepGoal = s.dailyStepGoal
  const milesGoal = Number(s.weeklyMilesGoal)

  const dailySteps = totals.map((t) => ({ date: t.date, steps: t.totalSteps }))
  const todayTotals = totals[totals.length - 1]
  const streak = computeStreak(dailySteps, stepGoal)

  const weeks = bucketByWeek(
    totals.map((t) => ({ date: t.date, miles: t.totalDistanceMi })),
  )
  const thisWeekMiles = weeks[weeks.length - 1]?.miles ?? 0

  const ytdMiles = totals
    .filter((t) => t.date >= yearStart)
    .reduce((sum, t) => sum + t.totalDistanceMi, 0)
  const ytdWorkoutCount = workouts.filter(
    (w) => localDateKey(w.startAt, timezone) >= yearStart,
  ).length

  const last30 = totals.slice(-30).map((t) => ({
    date: t.date,
    treadmillSteps: t.treadmillSteps,
    outdoorSteps: t.outdoorSteps,
  }))

  const paceIncline = bucketPaceIncline(
    workouts
      .filter((w) => w.source === "treadmill")
      .map((w) => ({
        date: localDateKey(w.startAt, timezone),
        speedMph: w.speedMph === null ? null : Number(w.speedMph),
        inclinePct: w.inclinePct === null ? null : Number(w.inclinePct),
      })),
  )

  const prs = computePRs({
    workouts: workouts.map((w) => ({
      source: w.source,
      minutes: Number(w.minutes),
      speedMph: w.speedMph === null ? null : Number(w.speedMph),
      date: localDateKey(w.startAt, timezone),
    })),
    dailySteps,
    goal: stepGoal,
  })

  const heatmap = dailySteps.map((d) => ({ date: d.date, steps: d.steps }))

  // Convert Date instances to ISO strings for the client component.
  const serialized = workouts.map((w) => ({
    ...w,
    startAt: w.startAt.toISOString(),
    endAt: w.endAt.toISOString(),
    createdAt: w.createdAt.toISOString(),
    updatedAt: w.updatedAt.toISOString(),
  }))

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:py-12 flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Olympic</h1>
          <p className="text-sm text-muted-foreground">Treadmill log</p>
        </div>
        <Link href="/settings" className="text-sm underline-offset-4 hover:underline">
          Settings →
        </Link>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <TodayCard
          steps={todayTotals?.totalSteps ?? 0}
          distanceMi={todayTotals?.totalDistanceMi ?? 0}
          calories={todayTotals?.totalCalories ?? 0}
          goal={stepGoal}
        />
        <StreakCard days={streak} />
        <WeekCard miles={thisWeekMiles} goalMiles={milesGoal} />
        <YtdCard miles={ytdMiles} workoutCount={ytdWorkoutCount} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Log a workout</CardTitle>
        </CardHeader>
        <CardContent>
          <EntryFormIsland settings={settings} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daily steps · last 30 days</CardTitle>
        </CardHeader>
        <CardContent>
          <DailyStepsBar data={last30} goal={stepGoal} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Weekly miles</CardTitle>
          </CardHeader>
          <CardContent>
            <WeeklyMilesLine weeks={weeks} />
          </CardContent>
        </Card>
        <PrsPanel prs={prs} today={today} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Past year</CardTitle>
        </CardHeader>
        <CardContent>
          <YearHeatmap data={heatmap} maxScale={stepGoal} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pace trend</CardTitle>
          </CardHeader>
          <CardContent>
            <PaceInclineTrend data={paceIncline} metric="speed" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Incline trend</CardTitle>
          </CardHeader>
          <CardContent>
            <PaceInclineTrend data={paceIncline} metric="incline" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent workouts</CardTitle>
        </CardHeader>
        <CardContent>
          <WorkoutList workouts={serialized} settings={settings} />
        </CardContent>
      </Card>
    </main>
  )
}
