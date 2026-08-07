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
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Evan Appel
          </Link>
          <p className="text-sm text-muted-foreground">
            Full-stack engineer — a tool I built and use daily.
          </p>
        </div>

        <nav
          aria-label="Profile links"
          className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm"
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
