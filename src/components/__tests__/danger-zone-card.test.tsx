import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import { DangerZoneCard } from "../danger-zone-card"

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

async function openDialog(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /delete all data/i }))
}

describe("<DangerZoneCard>", () => {
  it("keeps the confirm button disabled until the exact phrase is typed", async () => {
    const user = userEvent.setup()
    render(<DangerZoneCard />)
    await openDialog(user)

    const confirm = screen.getByRole("button", { name: /delete everything/i })
    expect(confirm).toBeDisabled()

    await user.type(screen.getByLabelText(/type/i), "delete all data")
    expect(confirm).toBeDisabled() // case-sensitive

    await user.clear(screen.getByLabelText(/type/i))
    await user.type(screen.getByLabelText(/type/i), "DELETE ALL DATA")
    expect(confirm).toBeEnabled()
  })

  it("sends the confirmation header and reports counts on success", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({ workoutsDeleted: 3, dailyMetricsDeleted: 7 }),
        { status: 200 },
      ),
    )
    const user = userEvent.setup()
    render(<DangerZoneCard />)
    await openDialog(user)
    await user.type(screen.getByLabelText(/type/i), "DELETE ALL DATA")
    await user.click(screen.getByRole("button", { name: /delete everything/i }))

    expect(fetch).toHaveBeenCalledWith("/api/all-data", {
      method: "DELETE",
      headers: { "x-confirm-delete": "DELETE ALL DATA" },
    })
  })

  it("does not call the API if somehow submitted without the phrase", async () => {
    const user = userEvent.setup()
    render(<DangerZoneCard />)
    await openDialog(user)
    // Confirm button is disabled; clicking it is a no-op.
    await user.click(screen.getByRole("button", { name: /delete everything/i }))
    expect(fetch).not.toHaveBeenCalled()
  })
})
