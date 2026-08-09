import { isoWeekStart } from "./chart-data"

export interface WorldEvent {
  date: string // YYYY-MM-DD
  label: string
}

/**
 * Significant news / world events overlaid on the activity charts to give
 * context to the health journey. This is a hand-curated list — add new
 * entries here as events occur. Keep them sorted by date.
 */
export const WORLD_EVENTS: WorldEvent[] = [
  { date: "2024-07-26", label: "Paris Olympics" },
  { date: "2024-11-05", label: "US election" },
  { date: "2025-01-20", label: "US inauguration" },
  { date: "2025-06-13", label: "Israel–Iran war" },
  { date: "2026-02-06", label: "Winter Olympics" },
]

export interface EventMarker {
  /** The axis category value the line should attach to. */
  x: string
  label: string
  date: string
}

/**
 * Map world events onto the categories actually present on a chart's x-axis.
 *
 * Recharts draws a vertical ReferenceLine on a category axis only when `x`
 * exactly matches one of the rendered categories, so we snap each event to the
 * relevant category and drop events that fall outside the chart's range.
 *
 * @param categories the x-axis values present in the chart, in order
 * @param granularity "day" matches an exact date; "week" snaps to the event's
 *   ISO week start (Monday), matching the weekly buckets used by the charts
 */
export function eventMarkersFor(
  categories: string[],
  granularity: "day" | "week",
): EventMarker[] {
  if (categories.length === 0) return []
  const present = new Set(categories)
  const markers: EventMarker[] = []
  for (const ev of WORLD_EVENTS) {
    const x = granularity === "week" ? isoWeekStart(ev.date) : ev.date
    if (present.has(x)) {
      markers.push({ x, label: ev.label, date: ev.date })
    }
  }
  return markers
}
