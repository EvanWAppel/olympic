import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { listWorkouts } from "@/db/workouts.repo"
import { getSettings } from "@/db/settings.repo"
import { aggregateDailyMiles } from "@/lib/aggregate-daily"
import { DailyMilesChart } from "@/components/daily-miles-chart"
import { EntryFormIsland } from "@/components/entry-form-island"
import { WorkoutList } from "@/components/workout-list"

export const dynamic = "force-dynamic"

export default async function Home() {
  const [workouts, s] = await Promise.all([listWorkouts(), getSettings()])
  const settings = {
    weightLb: Number(s.weightLb),
    strideIn: Number(s.strideIn),
  }
  const daily = aggregateDailyMiles(workouts)
  const last7 = daily.slice(-7)

  // Convert Date instances to ISO strings for the client component.
  const serialized = workouts.map((w) => ({
    ...w,
    startAt: w.startAt.toISOString(),
    endAt: w.endAt.toISOString(),
    createdAt: w.createdAt.toISOString(),
    updatedAt: w.updatedAt.toISOString(),
  }))

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12 flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Olympic</h1>
          <p className="text-sm text-muted-foreground">Treadmill log</p>
        </div>
        <Link href="/settings" className="text-sm underline-offset-4 hover:underline">
          Settings →
        </Link>
      </header>

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
          <CardTitle>Miles · last 7 days</CardTitle>
        </CardHeader>
        <CardContent>
          {last7.length === 0 ? (
            <p className="text-sm text-muted-foreground">No workouts logged yet.</p>
          ) : (
            <DailyMilesChart data={last7} />
          )}
        </CardContent>
      </Card>

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
