"use client"

import dynamic from "next/dynamic"

/**
 * Lazy, client-only versions of the chart components. The charts pull in
 * Recharts (~380 KB) and react-activity-calendar, and they all sit below the
 * fold, so loading them eagerly bloats the dashboard's initial JS and hurts
 * TBT/LCP. Importing them through `next/dynamic` (ssr: false) splits each into
 * its own chunk that loads after hydration instead of on the critical path.
 *
 * Each placeholder reserves the chart's real height so deferring them does not
 * cause layout shift (CLS). The wrapper uses `ssr: false`, which is why this is
 * a client module — a Server Component may not pass that option.
 */

function ChartSkeleton({ className }: { className: string }) {
  return (
    <div
      className={`w-full animate-pulse rounded-md bg-muted ${className}`}
      aria-hidden="true"
    />
  )
}

export const DailyStepsBar = dynamic(
  () => import("./daily-steps-bar").then((m) => m.DailyStepsBar),
  { ssr: false, loading: () => <ChartSkeleton className="h-72" /> },
)

export const WeeklyMilesLine = dynamic(
  () => import("./weekly-miles-line").then((m) => m.WeeklyMilesLine),
  { ssr: false, loading: () => <ChartSkeleton className="h-72" /> },
)

export const PaceInclineTrend = dynamic(
  () => import("./pace-incline-trend").then((m) => m.PaceInclineTrend),
  { ssr: false, loading: () => <ChartSkeleton className="h-64" /> },
)

export const YearHeatmap = dynamic(
  () => import("./year-heatmap").then((m) => m.YearHeatmap),
  { ssr: false, loading: () => <ChartSkeleton className="h-40" /> },
)
