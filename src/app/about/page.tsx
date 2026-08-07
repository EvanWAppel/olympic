import type { Metadata } from "next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArchitectureDiagram } from "@/components/about/architecture-diagram"
import { getAboutMetrics } from "@/lib/about-metrics"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "About this build — Olympic",
  description:
    "How Olympic works: reconciling treadmill logs with Apple Health into one long-term movement dashboard. Architecture, decisions, and live metrics.",
}

const STACK: Array<[string, string]> = [
  ["Framework", "Next.js 16 App Router (TypeScript)"],
  ["UI", "shadcn/ui + Tailwind CSS"],
  ["Charts", "Recharts + react-activity-calendar"],
  ["Database", "Neon Postgres (Vercel Marketplace)"],
  ["ORM", "Drizzle"],
  ["Auth", "WebAuthn passkeys + jose-signed session cookie"],
  ["Hosting", "Vercel (Fluid Compute, Node.js)"],
]

const DECISIONS: Array<{ title: string; body: string }> = [
  {
    title: "Read-time dedup over precomputed totals",
    body: "Phone and treadmill both count the same steps. Rather than maintaining a reconciled total on every write, the overlap is subtracted at read time — one rule, no drift, and re-importing Apple Health is always safe.",
  },
  {
    title: "Passkeys over passwords",
    body: "One human, several devices, no password to phish or leak. A signed httpOnly cookie carries the session; credentials live in Postgres. Registration is gated by a one-time bootstrap secret so a public /register can't be abused.",
  },
  {
    title: "Route-level access control over deployment protection",
    body: "v1 hid everything behind Vercel SSO. v2 needs a public dashboard and a private write side from one deployment, so a single requireOwner() guard wraps every mutation and secret-bearing route, and public reads go through field-whitelist DTOs.",
  },
  {
    title: "Single-user, no multi-tenancy",
    body: "No user_id columns, no sign-up, no org model. The public audience is anonymous and read-only; the owner is me. That keeps the schema and the surface area small.",
  },
  {
    title: "PWA over native",
    body: "The daily job is logging a workout one-handed at the gym. A home-screen PWA with an offline save queue does that without an app store, and installs for any public visitor too.",
  },
]

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="text-2xl font-semibold tracking-tight tabular-nums">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  )
}

export default async function AboutPage() {
  const metrics = await getAboutMetrics()

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">About this build</h1>
        <p className="text-sm text-muted-foreground">
          A real tool I use daily, engineered as a portfolio piece.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Why I built it</CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-relaxed text-muted-foreground flex flex-col gap-3">
          <p>
            I walk on a treadmill at the gym and outdoors. That data used to live in two
            disconnected places — my head (speed/incline/duration) and Apple Health (passive
            steps, distance, outdoor walks) — so I had no long-term view of total movement and
            no record to look back on a year from now.
          </p>
          <p>
            Olympic reconciles both sources into one dashboard: daily, weekly, monthly, and a
            year-long heatmap. It stays a ten-second logging tool on my phone while doubling as
            something a hiring manager can open in two minutes with no login.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How the data flows</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ArchitectureDiagram />
          <p className="text-sm leading-relaxed text-muted-foreground">
            Apple Health arrives two ways — a one-time backfill zip and a nightly push from the
            Health Auto Export app — and both land in Postgres as phone-reported daily metrics
            plus outdoor walks. Treadmill sessions are logged directly. Because the phone already
            counts treadmill steps, displayed totals subtract each treadmill workout&apos;s own
            steps/distance/calories from the phone total for that day, then add the treadmill
            figures back — so a workout is counted once, computed fresh on every read.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Decisions &amp; tradeoffs</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {DECISIONS.map((d) => (
            <div key={d.title}>
              <h3 className="text-sm font-medium">{d.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{d.body}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stack &amp; live metrics</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric value={metrics.totalWorkouts.toLocaleString()} label="workouts logged" />
            <Metric value={metrics.daysOfData.toLocaleString()} label="days of data" />
            <Metric value={metrics.currentStreak.toLocaleString()} label="day streak" />
            <Metric value={metrics.testCount.toLocaleString()} label="automated tests" />
          </div>
          <p className="text-xs text-muted-foreground">
            Figures above are queried live at render (tests captured at build). Lighthouse on
            production: Accessibility 100, Best Practices 100, SEO 100.
          </p>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
            {STACK.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-b border-border py-1.5">
                <dt className="text-sm text-muted-foreground">{k}</dt>
                <dd className="text-sm text-right">{v}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </main>
  )
}
