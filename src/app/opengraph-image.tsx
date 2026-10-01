import { ImageResponse } from "next/og"
import { getSocialStats, type SocialStats } from "@/lib/social-stats"

// The card reflects live data, so render it per request rather than at build
// time (where no database is available).
export const dynamic = "force-dynamic"

export const alt = "Olympic — a long-term movement journal"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

// Editorial palette (globals.css).
const INK = "#25291f"
const CREAM = "#f4f2eb"
const MUTED = "#727569"
const RUST = "#bd4228"
const BORDER = "#dcded1"

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ fontSize: 64, fontWeight: 700, color: INK, lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 24, color: MUTED, letterSpacing: 1 }}>{label}</div>
    </div>
  )
}

export default async function OpengraphImage() {
  let stats: SocialStats | null = null
  try {
    stats = await getSocialStats()
  } catch {
    // Fall back to a numberless branded card if the DB is unreachable.
    stats = null
  }

  const fmt = (n: number) => n.toLocaleString("en-US")

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: 72,
          backgroundColor: CREAM,
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              fontSize: 40,
              fontWeight: 700,
              letterSpacing: 8,
              color: INK,
            }}
          >
            OLYMPIC
          </div>
          <div style={{ fontSize: 26, color: MUTED, letterSpacing: 1 }}>
            A long-term movement journal
          </div>
        </div>

        {stats ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 24,
              }}
            >
              <div style={{ fontSize: 180, fontWeight: 700, color: RUST, lineHeight: 1 }}>
                {fmt(stats.ytdMiles)}
              </div>
              <div style={{ fontSize: 44, color: INK }}>miles this year</div>
            </div>
            <div style={{ fontSize: 30, color: MUTED }}>
              {`≈ ${fmt(stats.marathons)} marathons`}
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 56, color: INK }}>
            Reconciling treadmill &amp; Apple Health into one record.
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: 72,
            borderTop: `2px solid ${BORDER}`,
            paddingTop: 32,
          }}
        >
          {stats
            ? [
                <Stat
                  key="streak"
                  value={`${fmt(stats.currentStreak)} days`}
                  label="CURRENT STREAK"
                />,
                <Stat
                  key="workouts"
                  value={fmt(stats.totalWorkouts)}
                  label="WORKOUTS LOGGED"
                />,
                <Stat key="days" value={fmt(stats.daysOfData)} label="DAYS TRACKED" />,
              ]
            : null}
        </div>
      </div>
    ),
    { ...size },
  )
}
