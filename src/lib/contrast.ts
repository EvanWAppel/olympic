// WCAG 2.x colour-contrast helpers, plus a tiny parser for our flat globals.css.
// Used by the contrast regression test (src/app/__tests__/globals-contrast.test.ts);
// no runtime callers. Only hex colours are supported — the palette is all hex.

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.trim().replace(/^#/, "")
  if (h.length === 3) h = h.split("").map((c) => c + c).join("")
  if (!/^[0-9a-f]{6}$/i.test(h)) throw new Error(`Unsupported colour: ${hex}`)
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number]
}

/** WCAG relative luminance (0 = black, 1 = white). */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG contrast ratio, 1–21, independent of argument order. */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, "")
}

function customProps(body: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const m of body.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) out[m[1]] = m[2].trim()
  return out
}

/** Custom properties from `:root` (light) and, if present, `.dark` (dark). */
export function parseThemeTokens(css: string): { light: Record<string, string>; dark?: Record<string, string> } {
  const clean = stripComments(css)
  const light = /:root\s*\{([^}]*)\}/.exec(clean)
  const dark = /\.dark\s*\{([^}]*)\}/.exec(clean)
  return {
    light: light ? customProps(light[1]) : {},
    ...(dark ? { dark: customProps(dark[1]) } : {}),
  }
}

function resolve(value: string, tokens: Record<string, string>): { value: string; isToken: boolean } {
  const v = /^var\(--([\w-]+)\)$/.exec(value.trim())
  if (v) {
    const t = tokens[v[1]]
    if (t === undefined) throw new Error(`Unknown token --${v[1]}`)
    return { value: t, isToken: true }
  }
  return { value: value.trim(), isToken: false }
}

/**
 * Every innermost rule that sets a text `color`, with its own `background`
 * (if it sets one) — `var(--x)` resolved against `tokens`.
 */
export function parseCssColorRules(
  css: string,
  tokens: Record<string, string>,
): Array<{ selector: string; color: string; background: string | undefined; colorIsToken: boolean }> {
  const out: Array<{ selector: string; color: string; background: string | undefined; colorIsToken: boolean }> = []
  for (const m of stripComments(css).matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = m[1].trim()
    const body = m[2]
    const color = /(?<![-\w])color\s*:\s*([^;]+)/.exec(body)
    if (!color) continue
    const bg = /(?<![-\w])background(?:-color)?\s*:\s*([^;]+)/.exec(body)
    const c = resolve(color[1], tokens)
    out.push({
      selector,
      color: c.value,
      background: bg ? resolve(bg[1], tokens).value : undefined,
      colorIsToken: c.isToken,
    })
  }
  return out
}
