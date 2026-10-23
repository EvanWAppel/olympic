import { describe, it, expect, vi } from "vitest"
import { isValidElement, type ReactElement, type ReactNode } from "react"

// S1: the root layout must render Vercel Web Analytics on every page.
// next/font and the session are mocked so the layout can be called as a plain
// async function; the element tree it returns is then searched for <Analytics />.
vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "geist", className: "geist" }),
  Geist_Mono: () => ({ variable: "geist-mono", className: "geist-mono" }),
}))
vi.mock("@/lib/session", () => ({ getSession: vi.fn(async () => null) }))
vi.mock("@/components/site-header", () => ({ SiteHeader: () => null }))
vi.mock("@/components/pwa-setup", () => ({ PwaSetup: () => null }))
vi.mock("@/components/ui/sonner", () => ({ Toaster: () => null }))
vi.mock("@vercel/analytics/next", () => ({
  Analytics: function Analytics() {
    return null
  },
}))

function containsType(node: ReactNode, type: unknown): boolean {
  if (Array.isArray(node)) return node.some((n) => containsType(n, type))
  if (!isValidElement(node)) return false
  const el = node as ReactElement<{ children?: ReactNode }>
  if (el.type === type) return true
  return containsType(el.props.children, type)
}

describe("RootLayout", () => {
  it("renders Vercel <Analytics /> in the document body", async () => {
    const { Analytics } = await import("@vercel/analytics/next")
    const { default: RootLayout } = await import("../layout")
    const tree = await RootLayout({ children: <main /> })
    expect(containsType(tree, Analytics)).toBe(true)
  })
})
