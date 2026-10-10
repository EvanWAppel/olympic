import type { ReactNode } from "react"

// Editorial palette (globals.css), inlined because next/og can't read CSS.
export const OG_INK = "#25291f"
export const OG_CREAM = "#f4f2eb"
export const OG_MUTED = "#727569"
export const OG_RUST = "#bd4228"
export const OG_BORDER = "#dcded1"

export const ogSize = { width: 1200, height: 630 }

export function OgStat({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ fontSize: 64, fontWeight: 700, color: OG_INK, lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 24, color: OG_MUTED, letterSpacing: 1 }}>{label}</div>
    </div>
  )
}

/** Shared social-card chrome: OLYMPIC masthead, a hero slot, a stats row. */
export function OgFrame({
  tagline,
  hero,
  stats,
}: {
  tagline: string
  hero: ReactNode
  stats: ReactNode
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: "100%",
        height: "100%",
        padding: 72,
        backgroundColor: OG_CREAM,
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: 8, color: OG_INK }}>
          OLYMPIC
        </div>
        <div style={{ fontSize: 26, color: OG_MUTED, letterSpacing: 1 }}>{tagline}</div>
      </div>
      {hero}
      <div
        style={{
          display: "flex",
          gap: 72,
          borderTop: `2px solid ${OG_BORDER}`,
          paddingTop: 32,
        }}
      >
        {stats}
      </div>
    </div>
  )
}

/** Big rust number + unit line + muted sub-line. */
export function OgHero({ value, unit, sub }: { value: string; unit: string; sub: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 24 }}>
        <div style={{ fontSize: 180, fontWeight: 700, color: OG_RUST, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 44, color: OG_INK }}>{unit}</div>
      </div>
      <div style={{ fontSize: 30, color: OG_MUTED }}>{sub}</div>
    </div>
  )
}
