// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest"

// The guard only cares whether a session exists; mock it directly so this
// stays a pure unit test with no cookie/DB dependency.
vi.mock("@/lib/session", () => ({ getSession: vi.fn() }))

import { getSession } from "@/lib/session"
import { requireOwnerOr401 } from "../api-guard"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("requireOwnerOr401", () => {
  it("returns a 401 response when there is no session", async () => {
    vi.mocked(getSession).mockResolvedValue(null)

    const res = await requireOwnerOr401()
    expect(res).not.toBeNull()
    expect(res!.status).toBe(401)
    expect(await res!.json()).toEqual({ error: "unauthorized" })
  })

  it("returns null (proceed) when an owner session is present", async () => {
    vi.mocked(getSession).mockResolvedValue({ sub: "owner" })

    const res = await requireOwnerOr401()
    expect(res).toBeNull()
  })
})
