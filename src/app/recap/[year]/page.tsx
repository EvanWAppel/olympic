import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { YearRecapView } from "@/components/year-recap-view"
import { getYearRecap, listRecapYears } from "@/lib/recap-data"

export const dynamic = "force-dynamic"

type Params = { params: Promise<{ year: string }> }

/** Only plain four-digit years reach the loader; anything else is a 404. */
function parseYear(raw: string): number | null {
  return /^\d{4}$/.test(raw) ? Number(raw) : null
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { year } = await params
  const title = `${year} in movement — Olympic`
  const description = `A year-in-review of ${year}: miles walked, steps, streaks, and best moments, from treadmill logs and Apple Health.`
  // Nested metadata objects replace (not merge with) the layout's, so restate
  // the shared fields. og:image comes from ./opengraph-image.tsx.
  return {
    title,
    description,
    openGraph: { title, description, url: `/recap/${year}`, siteName: "Olympic", type: "website" },
    twitter: { card: "summary_large_image", title, description },
  }
}

export default async function RecapPage({ params }: Params) {
  const year = parseYear((await params).year)
  if (year === null) notFound()

  const [recap, years] = await Promise.all([getYearRecap(year), listRecapYears()])
  if (!recap) notFound()

  return <YearRecapView recap={recap} years={years} />
}
