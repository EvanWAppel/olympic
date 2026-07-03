import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { localDateKey } from "@/lib/dates"
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
import { SectionErrorBoundary } from "@/components/section-error-boundary"
import {
  demoDailyTotals,
  demoMilesGoal,
  demoStepGoal,
  demoTimezone,
  demoWorkouts,
} from "@/lib/demo/sample"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Olympic — Demo",
  description: "A read-only, sign-in-free demo of the Olympic health tracker.",
}

export default function DemoPage() {
  const timezone = demoTimezone
  const today = localDateKey(new Date(), timezone)
  const yearStart = `${today.slice(0, 4)}-01-01`

  const totals = demoDailyTotals(today)
  const workouts = demoWorkouts(today)

  const stepGoal = demoStepGoal
  const milesGoal = demoMilesGoal

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
        speedMph: w.speedMph,
        inclinePct: w.inclinePct,
      })),
  )

  const prs = computePRs({
    workouts: workouts.map((w) => ({
      source: w.source,
      minutes: w.minutes,
      speedMph: w.speedMph,
      date: localDateKey(w.startAt, timezone),
    })),
    dailySteps,
    goal: stepGoal,
  })

  const heatmap = dailySteps.map((d) => ({ date: d.date, steps: d.steps }))

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:py-12 flex flex-col gap-6">
      <div className="rounded-lg border border-dashed bg-muted/40 px-4 py-3 text-sm">
        <span className="font-medium">Demo</span> · sample data, read-only. No
        sign-in required.{" "}
        <Link href="/" className="underline underline-offset-4">
          Back to Olympic
        </Link>
      </div>

      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Olympic</h1>
        <p className="text-sm text-muted-foreground">Treadmill log · demo</p>
      </header>

      <SectionErrorBoundary name="Summary cards">
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
      </SectionErrorBoundary>

      <SectionErrorBoundary name="Daily steps">
        <Card>
          <CardHeader>
            <CardTitle>Daily steps · last 30 days</CardTitle>
          </CardHeader>
          <CardContent>
            <DailyStepsBar data={last30} goal={stepGoal} />
          </CardContent>
        </Card>
      </SectionErrorBoundary>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionErrorBoundary name="Weekly miles">
          <Card>
            <CardHeader>
              <CardTitle>Weekly miles</CardTitle>
            </CardHeader>
            <CardContent>
              <WeeklyMilesLine weeks={weeks} />
            </CardContent>
          </Card>
        </SectionErrorBoundary>
        <SectionErrorBoundary name="Personal records">
          <PrsPanel prs={prs} today={today} />
        </SectionErrorBoundary>
      </div>

      <SectionErrorBoundary name="Past year">
        <Card>
          <CardHeader>
            <CardTitle>Past year</CardTitle>
          </CardHeader>
          <CardContent>
            <YearHeatmap data={heatmap} maxScale={stepGoal} />
          </CardContent>
        </Card>
      </SectionErrorBoundary>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionErrorBoundary name="Pace trend">
          <Card>
            <CardHeader>
              <CardTitle>Pace trend</CardTitle>
            </CardHeader>
            <CardContent>
              <PaceInclineTrend data={paceIncline} metric="speed" />
            </CardContent>
          </Card>
        </SectionErrorBoundary>
        <SectionErrorBoundary name="Incline trend">
          <Card>
            <CardHeader>
              <CardTitle>Incline trend</CardTitle>
            </CardHeader>
            <CardContent>
              <PaceInclineTrend data={paceIncline} metric="incline" />
            </CardContent>
          </Card>
        </SectionErrorBoundary>
      </div>

      <SectionErrorBoundary name="Recent workouts">
        <Card>
          <CardHeader>
            <CardTitle>Recent workouts</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {workouts.map((w) => (
                <li
                  key={w.id}
                  className="flex items-center justify-between gap-4 py-2 text-sm"
                >
                  <span className="tabular-nums">
                    {localDateKey(w.startAt, timezone)} · {w.source}
                  </span>
                  <span className="text-muted-foreground text-right">
                    {w.minutes} min
                    {w.speedMph !== null ? ` · ${w.speedMph} mph` : ""}
                    {w.inclinePct !== null ? ` · ${w.inclinePct}% incline` : ""}
                    {" · "}
                    {w.distanceMi} mi
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </SectionErrorBoundary>
    </main>
  )
}
