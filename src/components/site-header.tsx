import Link from "next/link"

/**
 * Persistent recruiter-facing identity header (PRD §8.1). Shows on every public
 * page: name + tagline and the external links a hiring manager would follow.
 * Deliberately has NO login button — owner login is unadvertised (§5.6). The
 * Settings shortcut only appears when an owner session is present.
 */

// Sourced from ~/Documents/career (PRD §8.1). Personal-site deployed URL is
// still TBD, so link the source repo until the live domain is confirmed.
const LINKS = [
  { label: "GitHub", href: "https://github.com/EvanWAppel/olympic" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/evan-appel-8885569b/" },
  { label: "Resume", href: "/resume.pdf" },
  { label: "Personal site", href: "https://github.com/EvanWAppel/enki" },
  { label: "Email", href: "mailto:appelew@gmail.com" },
] as const

export function SiteHeader({ ownerMode = false }: { ownerMode?: boolean }) {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <div className="brand-group">
          <Link href="/" className="brand" aria-label="Olympic home"><span className="brand-mark" aria-hidden="true">↗</span>olympic<span className="brand-dot">®</span></Link>
          <div className="creator"><span>BUILT & WALKED BY</span><span>Evan Appel</span></div>
        </div>

        <nav
          aria-label="Profile links"
          className="profile-nav"
        >
          {LINKS.map(({ label, href }) => {
            const external = href.startsWith("http")
            return (
              <a
                key={label}
                href={href}
                className="text-muted-foreground hover:text-foreground"
                {...(external
                  ? { target: "_blank", rel: "noreferrer noopener" }
                  : {})}
              >
                {label}
              </a>
            )
          })}
          <Link
            href="/about"
            className="font-medium underline-offset-4 hover:underline"
          >
            About this build
          </Link>
          {ownerMode && (
            <Link href="/settings" className="text-muted-foreground hover:text-foreground">
              Settings
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
