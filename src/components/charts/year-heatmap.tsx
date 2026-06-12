"use client"

import { ActivityCalendar } from "react-activity-calendar"

export interface HeatmapDay {
  date: string // YYYY-MM-DD
  steps: number
}

interface Props {
  data: HeatmapDay[]
  /** Steps that map to the highest intensity bucket. */
  maxScale?: number
}

function level(steps: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (steps <= 0) return 0
  const frac = Math.min(1, steps / max)
  if (frac < 0.25) return 1
  if (frac < 0.5) return 2
  if (frac < 0.75) return 3
  return 4
}

export function YearHeatmap({ data, maxScale = 12_000 }: Props) {
  const transformed = data.map((d) => ({
    date: d.date,
    count: Math.round(d.steps),
    level: level(d.steps, maxScale),
  }))

  return (
    <ActivityCalendar
      data={transformed}
      blockSize={11}
      blockMargin={3}
      fontSize={11}
      labels={{
        legend: { less: "Quiet", more: "Active" },
        totalCount: "{{count}} steps in {{year}}",
      }}
      theme={{
        light: ["#ebedf0", "#c6e48b", "#7bc96f", "#239a3b", "#196127"],
        dark: ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"],
      }}
    />
  )
}
