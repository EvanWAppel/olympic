/** Local calendar date (YYYY-MM-DD) of an instant in a given IANA timezone. */
export function localDateKey(d: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d)
  const y = parts.find((p) => p.type === "year")?.value ?? "0000"
  const m = parts.find((p) => p.type === "month")?.value ?? "00"
  const day = parts.find((p) => p.type === "day")?.value ?? "00"
  return `${y}-${m}-${day}`
}

/** Shift a YYYY-MM-DD date string by a number of calendar days. */
export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + days)
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`
}

/** Whole calendar days from `fromStr` to `toStr` (both YYYY-MM-DD). Positive when `toStr` is later. */
export function daysBetween(fromStr: string, toStr: string): number {
  const [fy, fm, fd] = fromStr.split("-").map(Number)
  const [ty, tm, td] = toStr.split("-").map(Number)
  const from = Date.UTC(fy, fm - 1, fd)
  const to = Date.UTC(ty, tm - 1, td)
  return Math.round((to - from) / 86_400_000)
}

/**
 * Start of the dashboard's trailing-year window ending `today`: 364 days back,
 * but never later than Jan 1, so year-to-date figures stay complete when a
 * leap year makes Jan 1 fall 365 days back on Dec 31.
 */
export function trailingYearStart(today: string): string {
  const back = addDays(today, -364)
  const jan1 = `${today.slice(0, 4)}-01-01`
  return back < jan1 ? back : jan1
}
