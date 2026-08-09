import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { SiteHeader } from "../site-header"

describe("<SiteHeader>", () => {
  it("renders the name, tagline, and the recruiter links", () => {
    render(<SiteHeader />)

    expect(screen.getByText("Evan Appel")).toBeInTheDocument()

    const github = screen.getByRole("link", { name: /github/i })
    expect(github).toHaveAttribute("href", "https://github.com/EvanWAppel/olympic")

    const linkedin = screen.getByRole("link", { name: /linkedin/i })
    expect(linkedin).toHaveAttribute(
      "href",
      "https://www.linkedin.com/in/evan-appel-8885569b/",
    )

    const resume = screen.getByRole("link", { name: /resume/i })
    expect(resume).toHaveAttribute("href", "/resume.pdf")

    const email = screen.getByRole("link", { name: /email/i })
    expect(email).toHaveAttribute("href", "mailto:appelew@gmail.com")

    expect(
      screen.getByRole("link", { name: /about this build/i }),
    ).toHaveAttribute("href", "/about")
  })

  it("never renders a login button", () => {
    render(<SiteHeader />)
    expect(screen.queryByRole("button", { name: /log ?in/i })).not.toBeInTheDocument()
    expect(screen.queryByRole("link", { name: /^log ?in$/i })).not.toBeInTheDocument()
  })

  it("shows a Settings link only in owner mode", () => {
    const { rerender } = render(<SiteHeader />)
    expect(screen.queryByRole("link", { name: /settings/i })).not.toBeInTheDocument()

    rerender(<SiteHeader ownerMode />)
    expect(screen.getByRole("link", { name: /settings/i })).toHaveAttribute(
      "href",
      "/settings",
    )
  })
})
