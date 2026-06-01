import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { listWorkouts } from "@/db/workouts.repo"
import { aggregateDailyMiles } from "@/lib/aggregate-daily"
import { DailyMilesChart } from "@/components/daily-miles-chart"
import { EntryFormIsland } from "@/components/entry-form-island"

export const dynamic = "force-dynamic"

export default async function Home() {
  const workouts = await listWorkouts()
  const daily = aggregateDailyMiles(workouts)
  const last7 = daily.slice(-7)

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12 flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Olympic</h1>
        <p className="text-sm text-muted-foreground">Treadmill log</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Log a workout</CardTitle>
        </CardHeader>
        <CardContent>
          <EntryFormIsland />
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
          {workouts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing yet.</p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {workouts.slice(0, 10).map((w) => (
                <li key={w.id} className="flex justify-between py-2">
                  <span>
                    {new Date(w.startAt).toLocaleString()} ·{" "}
                    {Number(w.speedMph).toFixed(1)} mph @{" "}
                    {Number(w.inclinePct).toFixed(1)}%
                  </span>
                  <span className="text-muted-foreground">
                    {Number(w.distanceMi).toFixed(2)} mi · {Number(w.minutes)} min
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
