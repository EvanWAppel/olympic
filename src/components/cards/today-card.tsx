import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Props {
  steps: number
  distanceMi: number
  calories: number
  goal: number
}

export function TodayCard({ steps, distanceMi, calories, goal }: Props) {
  const pct = goal > 0 ? (steps / goal) * 100 : 0
  const barPct = Math.min(100, pct)
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Today
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tabular-nums">
          {steps.toLocaleString()}
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            / {goal.toLocaleString()} steps
          </span>
        </p>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-foreground transition-all"
            style={{ width: `${barPct}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {distanceMi.toFixed(2)} mi · {Math.round(calories)} cal ·{" "}
          {pct.toFixed(0)}% of goal
        </p>
      </CardContent>
    </Card>
  )
}
