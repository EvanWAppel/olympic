import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Props {
  miles: number
  goalMiles: number
}

export function WeekCard({ miles, goalMiles }: Props) {
  const pct = goalMiles > 0 ? Math.min(100, (miles / goalMiles) * 100) : 0
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          This week
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tabular-nums">
          {Number(miles.toFixed(1)).toLocaleString()}
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            / {Number(goalMiles.toFixed(1)).toLocaleString()} mi
          </span>
        </p>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-foreground transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">resets Monday</p>
      </CardContent>
    </Card>
  )
}
