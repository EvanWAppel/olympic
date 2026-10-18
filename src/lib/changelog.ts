/**
 * Shipped milestones for the public `/changelog` (PRD Group S3). Hand-curated
 * from TASKS.md phases and the git history; newest first. Dates are when the
 * work reached `main` (or production, where noted). Add an entry when a
 * milestone ships.
 */
export type Milestone = {
  /** Git tag or version label, when the milestone has one. */
  version?: string
  title: string
  /** ISO date (YYYY-MM-DD). */
  date: string
  items: string[]
}

export const MILESTONES: Milestone[] = [
  {
    version: "v3",
    title: "Portfolio signal features",
    date: "2026-10-11",
    items: [
      "Yearly mileage goal with a year-end projection, on-track status and a distance landmark for scale.",
      "Year in Movement recap pages (/recap) with a per-year social card.",
      "Dynamic Open Graph images built from live aggregate stats.",
      "Performance pass: charts lazy-loaded off the critical path (−32% initial JS), font preload, parallel dashboard reads.",
      "README case study and CI on every pull request.",
    ],
  },
  {
    version: "v2.0-public",
    title: "Public face and passkey auth",
    date: "2026-10-10",
    items: [
      "Live in production at olympic.evanappel.me.",
      "WebAuthn passkey login with a signed session cookie; no passwords.",
      "Public, read-only dashboard; every write and secret-bearing route behind one owner guard, public reads through field-whitelist DTOs.",
      "Recruiter-facing header and an /about page with architecture, decisions and live metrics.",
      "Editorial dashboard redesign.",
    ],
  },
  {
    title: "Post-1.0 additions",
    date: "2026-07-30",
    items: [
      "Demo mode with synthetic data.",
      "Daily mood tracking.",
      "World-events overlay on the charts.",
      "Backdated entries and a tighter mobile layout.",
    ],
  },
  {
    version: "v1.0",
    title: "Daily-driver release",
    date: "2026-06-22",
    items: [
      "Treadmill logging (speed, incline, duration) from a home-screen PWA with an offline save queue.",
      "Apple Health backfill from the export zip, plus daily streaming via Health Auto Export.",
      "Read-time dedup of phone and treadmill steps.",
      "Daily, weekly and monthly charts, a year heatmap, streaks and personal records.",
      "CSV export and a double-confirmed delete-all.",
    ],
  },
  {
    version: "v0.1-vertical-slice",
    title: "Vertical slice",
    date: "2026-05-31",
    items: [
      "One treadmill entry round-trips through the real stack: form → API → Neon Postgres → chart, deployed to Vercel.",
    ],
  },
]
