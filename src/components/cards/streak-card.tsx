import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Props {
  days: number
}

export function StreakCard({ days }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Streak
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tabular-nums">
          {days.toLocaleString()}
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            {days === 1 ? "day" : "days"}
          </span>
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          consecutive days hitting your step goal
        </p>
      </CardContent>
    </Card>
  )
}
