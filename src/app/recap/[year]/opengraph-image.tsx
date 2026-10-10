import { ImageResponse } from "next/og"
import { OG_INK, OgFrame, OgHero, OgStat, ogSize } from "@/components/og-card"
import { getYearRecap } from "@/lib/recap-data"

// Live data: render per request, never at build (no database there).
export const dynamic = "force-dynamic"

export const alt = "Olympic — a year in movement"
export const size = ogSize
export const contentType = "image/png"

const fmt = (n: number) => n.toLocaleString("en-US")

export default async function RecapOpengraphImage({
  params,
}: {
  params: Promise<{ year: string }>
}) {
  const raw = (await params).year
  const recap = /^\d{4}$/.test(raw) ? await getYearRecap(Number(raw)) : null

  return new ImageResponse(
    recap ? (
      <OgFrame
        tagline={`${recap.year} in movement${recap.isPartial ? ", so far" : ""}`}
        hero={
          <OgHero
            value={fmt(recap.totals.miles)}
            unit="miles"
            sub={`≈ ${fmt(recap.totals.marathons)} marathons · ${fmt(recap.totals.steps)} steps`}
          />
        }
        stats={[
          <OgStat key="days" value={fmt(recap.totals.daysTracked)} label="DAYS TRACKED" />,
          <OgStat
            key="streak"
            value={`${fmt(recap.longestStreak?.days ?? 0)} days`}
            label="LONGEST STREAK"
          />,
          <OgStat
            key="week"
            value={`${fmt(recap.bestWeek?.miles ?? 0)} mi`}
            label="BEST WEEK"
          />,
        ]}
      />
    ) : (
      <OgFrame
        tagline="A year in movement"
        hero={<div style={{ fontSize: 56, color: OG_INK }}>No recap for that year.</div>}
        stats={null}
      />
    ),
    { ...size },
  )
}
