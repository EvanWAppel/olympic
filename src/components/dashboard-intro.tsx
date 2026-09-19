import Link from "next/link"
import { ArrowDown, ArrowUpRight } from "lucide-react"

export function DashboardIntro({ today, demo = false }: { today: string; demo?: boolean }) {
  const date = new Date(`${today}T12:00:00Z`).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC",
  })
  return (
    <>
      <div className="dashboard-meta"><span><i /> {demo ? "THE DEMO JOURNAL" : "THE MOVEMENT JOURNAL"}</span><time dateTime={today}>{date}</time></div>
      <section className="dashboard-hero" aria-labelledby="dashboard-title">
        <div className="hero-copy">
          <p className="eyebrow">A LITTLE FURTHER. EVERY DAY.</p>
          <h1 id="dashboard-title">Made to<br /><em>move.</em></h1>
          <p className="hero-description">Small steps. Lasting momentum.<br />A personal record of showing up.</p>
          <a className="hero-link" href="#activity">Explore the numbers <ArrowDown size={15} /></a>
        </div>
        <div className="track-art" aria-hidden="true">
          <div className="track-caption">OLYMPIC ATHLETIC DEPT.<span>EST. 2026</span></div>
          <svg viewBox="0 0 520 350" fill="none">
            {[0, 1, 2, 3, 4, 5].map((lane) => <rect key={lane} x={24 + lane * 17} y={24 + lane * 17} width={472 - lane * 34} height={302 - lane * 34} rx={151 - lane * 17} stroke="currentColor" strokeWidth="2" />)}
            <path d="M260 24V109M260 241V326" stroke="currentColor" strokeWidth="2" />
            <circle cx="402" cy="267" r="10" fill="#242820" stroke="#f2f0e7" strokeWidth="4" />
            <text x="260" y="183" textAnchor="middle" fill="currentColor" className="track-word">keep going.</text>
          </svg>
          <div className="track-caption"><span>ONE STEP AT A TIME</span><span>↗</span></div>
        </div>
      </section>
      <nav className="dashboard-nav" aria-label="Dashboard sections">
        <div><a className="is-active" href="#activity">Overview</a><a href="#consistency">Consistency</a><a href="#workouts">Workouts</a></div>
        <span className="source-label">TREADMILL + APPLE HEALTH</span>
      </nav>
      {demo && <div className="demo-notice"><span><strong>Demo mode</strong> / Sample data. A real feel for the daily ritual.</span><Link href="/">Back to Olympic <ArrowUpRight size={14} /></Link></div>}
      <div className="section-heading" id="activity"><h2>Your movement, at a glance.</h2><span>01 / THE DAILY PICTURE</span></div>
    </>
  )
}
