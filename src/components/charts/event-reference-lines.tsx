import { ReferenceLine } from "recharts"
import type { EventMarker } from "@/lib/world-events"

/**
 * Build vertical ReferenceLine elements for world-event markers. Returns an
 * array (not a fragment) so the result can be spread directly into a recharts
 * chart's children, where recharts can detect each ReferenceLine by type.
 */
export function eventReferenceLines(markers: EventMarker[]) {
  return markers.map((m) => (
    <ReferenceLine
      key={`${m.x}-${m.label}`}
      x={m.x}
      stroke="hsl(var(--muted-foreground))"
      strokeDasharray="2 4"
      ifOverflow="extendDomain"
      label={{
        value: m.label,
        position: "insideTopLeft",
        fontSize: 9,
        fill: "hsl(var(--muted-foreground))",
      }}
    />
  ))
}
