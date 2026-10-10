import { ImageResponse } from "next/og"
import { OG_INK, OgFrame, OgHero, OgStat, ogSize } from "@/components/og-card"
import { getSocialStats, type SocialStats } from "@/lib/social-stats"

// The card reflects live data, so render it per request rather than at build
// time (where no database is available).
export const dynamic = "force-dynamic"

export const alt = "Olympic — a long-term movement journal"
export const size = ogSize
export const contentType = "image/png"

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
      <OgFrame
        tagline="A long-term movement journal"
        hero={
          stats ? (
            <OgHero
              value={fmt(stats.ytdMiles)}
              unit="miles this year"
              sub={`≈ ${fmt(stats.marathons)} marathons`}
            />
          ) : (
            <div style={{ fontSize: 56, color: OG_INK }}>
              Reconciling treadmill &amp; Apple Health into one record.
            </div>
          )
        }
        stats={
          stats
            ? [
                <OgStat
                  key="streak"
                  value={`${fmt(stats.currentStreak)} days`}
                  label="CURRENT STREAK"
                />,
                <OgStat key="workouts" value={fmt(stats.totalWorkouts)} label="WORKOUTS LOGGED" />,
                <OgStat key="days" value={fmt(stats.daysOfData)} label="DAYS TRACKED" />,
              ]
            : null
        }
      />
    ),
    { ...size },
  )
}
