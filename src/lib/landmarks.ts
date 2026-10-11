/**
 * Hand-curated distance landmarks for putting a mileage in human terms
 * ("91% of the Appalachian Trail"). Distances are commonly cited route
 * lengths in statute miles, rounded. Keep sorted ascending.
 */
export interface Landmark {
  /** Display name, including its article where English wants one. */
  name: string
  miles: number
}

export const LANDMARKS: Landmark[] = [
  { name: "Hadrian's Wall Path", miles: 84 },
  { name: "the West Highland Way", miles: 96 },
  { name: "the John Muir Trail", miles: 211 },
  { name: "the Camino de Santiago", miles: 500 },
  // Walking routes run ~1,000–1,200 mi; the 874 mi often quoted is by road.
  { name: "Britain end to end (Land's End to John o' Groats)", miles: 1200 },
  { name: "the Appalachian Trail", miles: 2197 },
  { name: "the Pacific Crest Trail", miles: 2650 },
  { name: "the Continental Divide Trail", miles: 3100 },
  { name: "a lap of the Earth", miles: 24_901 },
]

/**
 * Describe `miles` against the landmark closest to it in scale (smallest
 * |log ratio|), as a share when short of it or a multiple when past it.
 */
export function describeDistance(miles: number): string | null {
  if (!(miles > 0)) return null
  const best = LANDMARKS.reduce((a, b) =>
    Math.abs(Math.log(miles / b.miles)) < Math.abs(Math.log(miles / a.miles)) ? b : a,
  )
  const ratio = miles / best.miles
  if (ratio >= 0.95 && ratio < 1.05) return `about as far as ${best.name}`
  if (ratio < 1) return `${Math.round(ratio * 100)}% of ${best.name}`
  return `${Math.round(ratio * 10) / 10}× ${best.name}`
}
