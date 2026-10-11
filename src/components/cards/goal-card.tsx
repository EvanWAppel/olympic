import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GoalEditor } from "@/components/goal-editor"
import { describeDistance } from "@/lib/landmarks"
import type { YearProjection } from "@/lib/projection"

const fmt = (n: number) => n.toLocaleString("en-US")

function goalLine(goal: NonNullable<YearProjection["goal"]>) {
  if (goal.status === "met") return "Goal met. Everything from here is bonus."
  const pace =
    goal.paceVsGoalPct >= 0
      ? `${goal.paceVsGoalPct}% ahead of pace`
      : `${Math.abs(goal.paceVsGoalPct)}% behind pace`
  return goal.status === "behind" && goal.neededPerWeek > 0
    ? `${pace} · ${fmt(goal.neededPerWeek)} mi/week to get there`
    : pace
}

/**
 * Year-end projection at the year-to-date pace. Public read-only; in owner
 * mode it also carries the inline goal editor.
 */
export function GoalCard({
  projection,
  ownerMode,
}: {
  projection: YearProjection
  ownerMode: boolean
}) {
  const { goal } = projection
  const landmark = describeDistance(projection.projectedMiles)

  return (
    <Card className="goal-card">
      <CardHeader className="chart-heading">
        <div>
          <p className="eyebrow">YEAR-END PROJECTION</p>
          <CardTitle>
            On pace for <span className="goal-figure">{fmt(projection.projectedMiles)}</span> mi
          </CardTitle>
        </div>
        {goal && <span className="period-label">Goal {fmt(goal.target)} mi</span>}
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        {landmark && <p className="text-muted-foreground">That&rsquo;s {landmark}.</p>}
        {goal && (
          <>
            <div
              className="goal-progress"
              role="img"
              aria-label={`Projected ${fmt(projection.projectedMiles)} of a ${fmt(goal.target)} mile goal`}
            >
              <span
                style={{ width: `${Math.min(100, (projection.projectedMiles / goal.target) * 100)}%` }}
              />
            </div>
            <p>{goalLine(goal)}</p>
          </>
        )}
        {ownerMode && <GoalEditor initialGoal={goal?.target ?? null} />}
      </CardContent>
    </Card>
  )
}
