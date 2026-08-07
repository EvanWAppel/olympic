/**
 * Data-flow diagram for the /about case study (PRD §8.2): Apple Health enters
 * two ways (one-time backfill zip + nightly Health Auto Export), both land in
 * Postgres, and read-time dedup reconciles them into the dashboard. Rendered as
 * an inline, self-scaling SVG so it's crisp at any width and needs no asset.
 *
 * Colors use `currentColor` (the svg inherits the foreground text color) with
 * per-element opacity, rather than theme CSS vars inside a <style> block, which
 * don't resolve reliably across engines.
 */
const ACCENT = "#3b82f6"

function Box({
  x,
  y,
  title,
  sub,
  accent = false,
  w = 180,
}: {
  x: number
  y: number
  title: string
  sub: string
  accent?: boolean
  w?: number
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={52}
        rx={8}
        fill="currentColor"
        fillOpacity={0.05}
        stroke={accent ? ACCENT : "currentColor"}
        strokeOpacity={accent ? 0.9 : 0.25}
        strokeWidth={1.5}
      />
      <text x={x + 12} y={y + 22} fill="currentColor" fontSize={13} fontWeight={500}>
        {title}
      </text>
      <text x={x + 12} y={y + 39} fill="currentColor" fillOpacity={0.6} fontSize={11}>
        {sub}
      </text>
    </g>
  )
}

export function ArchitectureDiagram() {
  const edge = {
    stroke: "currentColor",
    strokeOpacity: 0.45,
    strokeWidth: 1.5,
    fill: "none",
    markerEnd: "url(#arrow)",
  }
  return (
    <svg
      viewBox="0 0 720 360"
      className="h-auto w-full text-foreground"
      role="img"
      aria-label="Data flow: Apple Health backfill zip and nightly Health Auto Export both feed the ingest and import API routes, which write phone-reported daily metrics and outdoor workouts to Postgres. Treadmill workouts are logged directly through the workouts API. At read time a dedup step reconciles phone totals with treadmill workouts and renders the dashboard."
    >
      <defs>
        <marker
          id="arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" fillOpacity={0.55} />
        </marker>
      </defs>

      {/* Sources */}
      <Box x={12} y={24} title="Apple Health export" sub="one-time backfill (zip)" />
      <Box x={12} y={150} title="Health Auto Export" sub="nightly JSON (iOS app)" />
      <Box x={12} y={276} title="Treadmill entry" sub="PWA form (owner)" />

      {/* API layer */}
      <Box x={270} y={24} title="/api/health" sub="import · ingest" accent w={150} />
      <Box x={270} y={276} title="/api/workouts" sub="POST (owner)" accent w={150} />

      {/* Postgres */}
      <g>
        <rect
          x={490}
          y={120}
          width={210}
          height={120}
          rx={8}
          fill="currentColor"
          fillOpacity={0.05}
          stroke="currentColor"
          strokeOpacity={0.25}
          strokeWidth={1.5}
        />
        <text x={506} y={146} fill="currentColor" fontSize={13} fontWeight={500}>
          Neon Postgres
        </text>
        <text x={506} y={168} fill="currentColor" fillOpacity={0.6} fontSize={11}>
          daily_metric (phone totals)
        </text>
        <text x={506} y={186} fill="currentColor" fillOpacity={0.6} fontSize={11}>
          workout (treadmill + outdoor)
        </text>
        <text x={506} y={214} fill={ACCENT} fontSize={11} fontWeight={500}>
          read-time dedup →
        </text>
        <text x={506} y={231} fill="currentColor" fillOpacity={0.6} fontSize={11}>
          reconciled daily totals
        </text>
      </g>

      {/* Edges */}
      <path {...edge} d="M192 50 H262" />
      <path {...edge} d="M192 176 C 230 176, 240 66, 262 54" />
      <path {...edge} d="M192 302 H262" />
      <path {...edge} d="M420 50 C 460 50, 470 120, 488 140" />
      <path {...edge} d="M420 302 C 460 302, 470 240, 488 220" />
    </svg>
  )
}
