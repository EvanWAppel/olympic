import { describe, expect, it } from "vitest"
import { contrastRatio, parseCssColorRules, parseThemeTokens, relativeLuminance } from "../contrast"

describe("relativeLuminance (WCAG 2.x)", () => {
  it("is 0 for black and 1 for white", () => {
    expect(relativeLuminance("#000000")).toBe(0)
    expect(relativeLuminance("#ffffff")).toBe(1)
  })

  it("accepts 3-digit hex", () => {
    expect(relativeLuminance("#fff")).toBe(1)
  })

  it("applies the sRGB linearisation (mid grey #777 ≈ 0.184)", () => {
    expect(relativeLuminance("#777777")).toBeCloseTo(0.1845, 3)
  })
})

describe("contrastRatio", () => {
  it("is 21 for black on white, order-independent", () => {
    expect(contrastRatio("#000", "#fff")).toBeCloseTo(21, 5)
    expect(contrastRatio("#fff", "#000")).toBeCloseTo(21, 5)
  })

  it("is 1 for identical colours", () => {
    expect(contrastRatio("#bd4228", "#bd4228")).toBe(1)
  })

  it("matches the known #767676-on-white AA threshold (~4.54)", () => {
    expect(contrastRatio("#767676", "#ffffff")).toBeCloseTo(4.54, 2)
  })
})

const css = `
:root {
  --background: #f4f2eb;
  --foreground: #25291f;
}
.dark {
  --background: #111;
  --foreground: #eee;
}
@theme inline { --color-background: var(--background); }
.a { color: #686e5e; }
.b { background: var(--foreground); color: #fff; padding: 2px; }
.c { color: var(--foreground); }
.d { border-bottom: 1px solid #b2b6a7; --color-x: #000; background-color: #fff; }
`

describe("parseThemeTokens", () => {
  it("reads light (:root) and dark (.dark) custom properties", () => {
    const themes = parseThemeTokens(css)
    expect(themes.light).toEqual({ background: "#f4f2eb", foreground: "#25291f" })
    expect(themes.dark).toEqual({ background: "#111", foreground: "#eee" })
  })

  it("omits dark when no dark block exists", () => {
    expect(parseThemeTokens(":root { --x: #000; }").dark).toBeUndefined()
  })
})

describe("parseCssColorRules", () => {
  it("returns each rule's text colour and own background, resolving var() and flagging token colours", () => {
    const rules = parseCssColorRules(css, { foreground: "#25291f" })
    expect(rules).toEqual([
      { selector: ".a", color: "#686e5e", background: undefined, colorIsToken: false },
      { selector: ".b", color: "#fff", background: "#25291f", colorIsToken: false },
      { selector: ".c", color: "#25291f", background: undefined, colorIsToken: true },
    ])
  })
})
