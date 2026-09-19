// @vitest-environment node
//
// NOTE: this route performs an UNSCOPED delete of every workout and daily
// metric. It must never run against the shared dev database (it would wipe
// real data), so the db client is mocked here. We test the confirmation guard
// and response shape, not real persistence.
import { beforeEach, describe, expect, it, vi } from "vitest"

const { deleteMock, returningMock } = vi.hoisted(() => {
  const returningMock = vi.fn()
  const deleteMock = vi.fn(() => ({ returning: returningMock }))
  return { deleteMock, returningMock }
})

vi.mock("@/db/client", () => ({
  db: { delete: deleteMock },
}))

// Owner-only route: mock the session so the guard sees an authenticated owner.
vi.mock("@/lib/session", () => ({ getSession: vi.fn() }))

import { getSession } from "@/lib/session"
import { DELETE, CONFIRM_PHRASE } from "../route"

function req(headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/api/all-data", {
    method: "DELETE",
    headers,
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getSession).mockResolvedValue({ sub: "owner" })
  // Route deletes workouts first, then daily metrics.
  returningMock
    .mockResolvedValueOnce([{ id: "a" }, { id: "b" }, { id: "c" }])
    .mockResolvedValueOnce([{ date: "d1" }, { date: "d2" }])
})

describe("DELETE /api/all-data", () => {
  it("returns 401 without an owner session and touches nothing", async () => {
    vi.mocked(getSession).mockResolvedValue(null)
    const res = await DELETE(req({ "x-confirm-delete": CONFIRM_PHRASE }))
    expect(res.status).toBe(401)
    expect(deleteMock).not.toHaveBeenCalled()
  })

  it("rejects without the confirmation header and touches nothing", async () => {
    const res = await DELETE(req())
    expect(res.status).toBe(400)
    expect(deleteMock).not.toHaveBeenCalled()
  })

  it("rejects with a wrong confirmation value", async () => {
    const res = await DELETE(req({ "x-confirm-delete": "nope" }))
    expect(res.status).toBe(400)
    expect(deleteMock).not.toHaveBeenCalled()
  })

  it("wipes both tables and returns counts with the correct header", async () => {
    const res = await DELETE(req({ "x-confirm-delete": CONFIRM_PHRASE }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ workoutsDeleted: 3, dailyMetricsDeleted: 2 })
    expect(deleteMock).toHaveBeenCalledTimes(2)
  })
})
