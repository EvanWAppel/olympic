import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { contrastRatio, parseCssColorRules, parseThemeTokens } from "@/lib/contrast"

// WCAG 2.x AA: 4.5:1 for normal text, 3:1 for large text (≥24px, or ≥18.66px bold).
const AA = 4.5
const AA_LARGE = 3

const css = readFileSync(path.resolve(__dirname, "../globals.css"), "utf8")
const themes = parseThemeTokens(css)

// Every text-on-surface token pairing the UI actually renders
// (Tailwind `text-*` on `bg-*`, plus the body/card defaults).
const TOKEN_PAIRS: Array<{ fg: string; bg: string; large?: boolean }> = [
  { fg: "foreground", bg: "background" },
  { fg: "foreground", bg: "card" },
  { fg: "foreground", bg: "muted" },
  { fg: "card-foreground", bg: "card" },
  { fg: "popover-foreground", bg: "popover" },
  { fg: "muted-foreground", bg: "background" },
  { fg: "muted-foreground", bg: "card" },
  { fg: "muted-foreground", bg: "muted" },
  { fg: "secondary-foreground", bg: "secondary" },
  { fg: "accent-foreground", bg: "accent" },
  { fg: "primary-foreground", bg: "primary" },
  { fg: "primary", bg: "background" },
  { fg: "primary", bg: "card" },
  { fg: "destructive", bg: "background" },
  { fg: "destructive", bg: "card" },
]

describe("globals.css colour contrast (WCAG AA)", () => {
  const themeEntries = Object.entries(themes).filter(
    (e): e is [string, Record<string, string>] => e[1] !== undefined,
  )

  it("finds the light theme tokens", () => {
    expect(themes.light.background).toBeDefined()
  })

  for (const [theme, tokens] of themeEntries) {
    describe(`${theme} theme tokens`, () => {
      for (const { fg, bg, large } of TOKEN_PAIRS) {
        it(`--${fg} on --${bg}`, () => {
          expect(tokens[fg], `missing --${fg}`).toBeDefined()
          expect(tokens[bg], `missing --${bg}`).toBeDefined()
          const ratio = contrastRatio(tokens[fg], tokens[bg])
          expect(ratio, `${tokens[fg]} on ${tokens[bg]} = ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(
            large ? AA_LARGE : AA,
          )
        })
      }
    })
  }

  // Hard-coded text colours in editorial rules. A rule that sets its own background is
  // checked against it; otherwise against every surface it can sit on (page, card, muted,
  // and the tinted today/records card fills).
  describe("rule-level text colours (light)", () => {
    const light = themes.light
    const tintedSurfaces = [...css.matchAll(/\.(?:today-card|records-card)[^{]*\{[^}]*background:\s*(#[0-9a-f]{3,6})/gi)].map(
      (m) => m[1],
    )
    const surfaces = [light.background, light.card, light.muted, ...tintedSurfaces]
    // Token-on-surface colours are covered by TOKEN_PAIRS above; here we check literal hex
    // text colours, plus token text on a rule's own background (TOKEN_PAIRS can't see that).
    const rules = parseCssColorRules(css, light).filter((r) => !r.colorIsToken || r.background)

    it("--muted-foreground on the tinted card fills", () => {
      expect(tintedSurfaces.length).toBeGreaterThan(0)
      for (const back of tintedSurfaces) {
        const ratio = contrastRatio(light["muted-foreground"], back)
        expect(ratio, `${light["muted-foreground"]} on ${back} = ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(AA)
      }
    })

    it("parses the editorial rules (track art sets its own colour + fill)", () => {
      expect(rules.map((r) => r.selector)).toContain(".track-art")
    })

    for (const rule of rules) {
      it(`${rule.selector} (${rule.color})`, () => {
        const backs = rule.background ? [rule.background] : surfaces
        for (const back of backs) {
          const ratio = contrastRatio(rule.color, back)
          expect(ratio, `${rule.color} on ${back} = ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(AA)
        }
      })
    }
  })
})
