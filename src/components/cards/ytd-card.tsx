import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Props {
  miles: number
  workoutCount: number
}

export function YtdCard({ miles, workoutCount }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Year to date
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tabular-nums">
          {Number(miles.toFixed(1)).toLocaleString()}
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            mi
          </span>
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          {workoutCount.toLocaleString()} workouts this year
        </p>
      </CardContent>
    </Card>
  )
}
