// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest"

// The /settings page renders the Health ingest secret. The proxy already
// guards it; the page checks Access itself too, so a proxy miss (matcher
// drift, an odd path encoding) can't hand the secret to a passkey holder
// who came around Cloudflare.
vi.mock("@/lib/access", () => ({ hasAccess: vi.fn() }))
vi.mock("@/lib/session", () => ({ getSession: vi.fn() }))
vi.mock("@/db/settings.repo", () => ({ getSettings: vi.fn() }))
const { notFound, redirect } = vi.hoisted(() => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND")
  }),
  redirect: vi.fn((to: string) => {
    throw new Error(`NEXT_REDIRECT ${to}`)
  }),
}))
vi.mock("next/navigation", () => ({ notFound, redirect }))

import { hasAccess } from "@/lib/access"
import { getSession } from "@/lib/session"
import { getSettings } from "@/db/settings.repo"
import SettingsPage from "../page"

beforeEach(() => {
  vi.mocked(getSettings).mockClear()
  vi.mocked(getSession).mockResolvedValue({ sub: "owner" })
})

describe("/settings page", () => {
  it("404s without Access, even with a passkey session, and never reads settings", async () => {
    vi.mocked(hasAccess).mockResolvedValue(false)
    await expect(SettingsPage()).rejects.toThrow("NEXT_NOT_FOUND")
    expect(getSettings).not.toHaveBeenCalled()
  })

  it("still redirects to /login with Access but no passkey session", async () => {
    vi.mocked(hasAccess).mockResolvedValue(true)
    vi.mocked(getSession).mockResolvedValue(null)
    await expect(SettingsPage()).rejects.toThrow("NEXT_REDIRECT /login")
    expect(getSettings).not.toHaveBeenCalled()
  })
})
