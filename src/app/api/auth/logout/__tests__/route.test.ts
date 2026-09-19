// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/session", () => ({
  clearSessionCookie: vi.fn(),
}))

import { clearSessionCookie } from "@/lib/session"
import { POST } from "../route"

beforeEach(() => {
  vi.mocked(clearSessionCookie).mockResolvedValue(undefined)
})

describe("POST /api/auth/logout", () => {
  it("clears the session cookie and returns ok", async () => {
    const res = await POST()
    expect(res.status).toBe(200)
    expect(clearSessionCookie).toHaveBeenCalledOnce()
    const body = await res.json()
    expect(body.ok).toBe(true)
  })
})
