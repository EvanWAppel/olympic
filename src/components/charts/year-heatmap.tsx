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

  // A full year is wider than a phone screen. Keep it in its own horizontal
  // scroll box so it never forces the whole page to scroll sideways.
  return (
    <div className="overflow-x-auto">
      <ActivityCalendar
        data={transformed}
        blockSize={13}
        blockMargin={3}
        fontSize={11}
        colorScheme="light"
        labels={{
          legend: { less: "Quiet", more: "Active" },
          totalCount: "{{count}} steps over the past year",
        }}
        theme={{
          light: ["#e9e8df", "#e4c9ad", "#d99e77", "#d16e47", "#b94026"],
          dark: ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"],
        }}
      />
    </div>
  )
}
