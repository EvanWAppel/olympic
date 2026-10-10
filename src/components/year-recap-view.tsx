import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { YearRecap } from "@/lib/recap"

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

const fmt = (n: number) => n.toLocaleString("en-US")

/** "June 14" (or "June 14, 2025" with `withYear`) from a YYYY-MM-DD key. */
function formatDate(date: string, withYear = false) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    ...(withYear ? { year: "numeric" } : {}),
    timeZone: "UTC",
  })
}

function Total({ value, label }: { value: string; label: string }) {
  return (
    <div className="recap-total">
      <p>{value}</p>
      <span>{label}</span>
    </div>
  )
}

function Moment({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="record-row flex items-baseline justify-between gap-4">
      <span>
        {label}
        <small className="block text-muted-foreground">{detail}</small>
      </span>
      <span>{value}</span>
    </div>
  )
}

export function YearRecapView({ recap, years }: { recap: YearRecap; years: number[] }) {
  const { totals, biggestDay, bestWeek, longestStreak, split } = recap
  const maxMonth = Math.max(1, ...recap.months.map((m) => m.miles ?? 0))

  return (
    <main className="dashboard-shell recap-shell">
      <div className="dashboard-meta">
        <span>THE YEAR IN MOVEMENT</span>
        <nav aria-label="Recap years" className="recap-years">
          {years.map((y) => (
            <Link key={y} href={`/recap/${y}`} aria-current={y === recap.year ? "page" : undefined}>
              {y}
            </Link>
          ))}
        </nav>
      </div>

      <section className="recap-hero" aria-labelledby="recap-title">
        <p className="eyebrow uppercase">
          {recap.isPartial ? `Through ${formatDate(recap.throughDate, true)}` : "The full year"}
        </p>
        <h1 id="recap-title">
          {recap.year} in movement{recap.isPartial && <em>, so far</em>}
        </h1>
        <p className="recap-miles">
          <strong>{fmt(totals.miles)}</strong> miles
          <span>
            That&rsquo;s {fmt(totals.marathons)} marathons, one step at a time.
          </span>
        </p>
      </section>

      <div className="recap-totals">
        <Total value={fmt(totals.steps)} label="steps" />
        <Total value={fmt(totals.calories)} label="active calories" />
        <Total value={fmt(totals.daysTracked)} label="days tracked" />
        <Total value={fmt(totals.workouts)} label="workouts logged" />
      </div>

      <div className="recap-grid">
        <Card className="records-card" role="region" aria-labelledby="recap-moments">
          <CardHeader>
            <CardTitle id="recap-moments">Best moments</CardTitle>
          </CardHeader>
          <CardContent>
            {biggestDay && (
              <Moment
                label="Biggest day"
                detail={`${formatDate(biggestDay.date)} · ${fmt(biggestDay.steps)} steps`}
                value={`${fmt(biggestDay.miles)} mi`}
              />
            )}
            {bestWeek && (
              <Moment
                label="Best week"
                detail={`Week of ${formatDate(bestWeek.weekStart)}`}
                value={`${fmt(bestWeek.miles)} mi`}
              />
            )}
            {longestStreak && (
              <Moment
                label="Longest streak"
                detail={`Daily step goal, ending ${formatDate(longestStreak.endDate)}`}
                value={`${longestStreak.days} days`}
              />
            )}
            <Moment
              label="Where the miles happened"
              detail={`${fmt(split.treadmillMi)} mi treadmill · ${fmt(split.outdoorMi)} mi outdoors`}
              value={`${split.treadmillPct}% treadmill`}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle id="recap-months">Month by month</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="recap-months" aria-label="Miles by month">
              {recap.months.map(({ month, miles }) => {
                const name = MONTHS[month - 1]
                return (
                  <li
                    key={month}
                    aria-label={miles === null ? `${name}: not yet` : `${name}: ${fmt(miles)} miles`}
                    className={miles === null ? "is-future" : undefined}
                  >
                    <span
                      className="recap-bar"
                      style={{ height: `${((miles ?? 0) / maxMonth) * 100}%` }}
                      aria-hidden="true"
                    />
                    <span className="recap-month" aria-hidden="true">{name[0]}</span>
                  </li>
                )
              })}
            </ol>
          </CardContent>
        </Card>
      </div>

      <footer className="dashboard-footer">
        <span>AGGREGATE FIGURES ONLY · TREADMILL + APPLE HEALTH, DEDUPLICATED</span>
        <Link href="/">Back to the journal ↗</Link>
      </footer>
    </main>
  )
}
