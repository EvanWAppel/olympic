import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { PRs } from "@/lib/prs"

interface Props {
  prs: PRs
  /** Local date YYYY-MM-DD used for the 7-day "new" window. */
  today: string
}

function daysBetween(from: string, to: string): number {
  const [fy, fm, fd] = from.split("-").map(Number)
  const [ty, tm, td] = to.split("-").map(Number)
  const a = Date.UTC(fy, fm - 1, fd)
  const b = Date.UTC(ty, tm - 1, td)
  return Math.round((b - a) / 86_400_000)
}

function PrRow({
  label,
  value,
  setAt,
  today,
}: {
  label: string
  value: string | null
  setAt: string | null
  today: string
}) {
  const isNew =
    value !== null && setAt !== null && daysBetween(setAt, today) <= 7
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2 text-sm font-medium tabular-nums">
        {value ?? "—"}
        {isNew && <Badge variant="default">new</Badge>}
      </span>
    </div>
  )
}

export function PrsPanel({ prs, today }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Personal records
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <PrRow
          label="Longest walk"
          value={
            prs.longestWalkMinutes
              ? `${prs.longestWalkMinutes.minutes} min`
              : null
          }
          setAt={prs.longestWalkMinutes?.setAt ?? null}
          today={today}
        />
        <PrRow
          label="Fastest avg speed"
          value={
            prs.fastestAvgSpeedMph
              ? `${prs.fastestAvgSpeedMph.speedMph} mph`
              : null
          }
          setAt={prs.fastestAvgSpeedMph?.setAt ?? null}
          today={today}
        />
        <PrRow
          label="Most steps in a day"
          value={
            prs.mostStepsDay
              ? prs.mostStepsDay.steps.toLocaleString("en-US")
              : null
          }
          setAt={prs.mostStepsDay?.setAt ?? null}
          today={today}
        />
        <PrRow
          label="Longest streak"
          value={prs.longestStreak ? `${prs.longestStreak.days} days` : null}
          setAt={prs.longestStreak?.setAt ?? null}
          today={today}
        />
      </CardContent>
    </Card>
  )
}
