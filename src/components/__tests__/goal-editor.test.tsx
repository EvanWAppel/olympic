import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import { GoalEditor } from "../goal-editor"
import { toast } from "sonner"

const ok = () => new Response(JSON.stringify({}), { status: 200 })

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal("fetch", vi.fn(async () => ok()))
})
afterEach(() => vi.unstubAllGlobals())

function patchedBody() {
  const [url, init] = vi.mocked(fetch).mock.calls[0]
  expect(url).toBe("/api/settings")
  expect((init as RequestInit).method).toBe("PATCH")
  return JSON.parse((init as RequestInit).body as string)
}

describe("<GoalEditor>", () => {
  it("offers to set a goal when none exists", () => {
    render(<GoalEditor initialGoal={null} />)
    expect(screen.getByRole("button", { name: /set a yearly goal/i })).toBeInTheDocument()
  })

  it("saves a new goal via PATCH /api/settings", async () => {
    const user = userEvent.setup()
    render(<GoalEditor initialGoal={null} />)
    await user.click(screen.getByRole("button", { name: /set a yearly goal/i }))
    await user.type(screen.getByLabelText(/yearly miles goal/i), "1200")
    await user.click(screen.getByRole("button", { name: /save/i }))
    expect(patchedBody()).toEqual({ yearlyMilesGoal: 1200 })
    expect(toast.success).toHaveBeenCalled()
  })

  it("prefills the current goal and can clear it", async () => {
    const user = userEvent.setup()
    render(<GoalEditor initialGoal={1095} />)
    await user.click(screen.getByRole("button", { name: /edit goal/i }))
    expect(screen.getByLabelText(/yearly miles goal/i)).toHaveValue(1095)
    await user.click(screen.getByRole("button", { name: /clear goal/i }))
    expect(patchedBody()).toEqual({ yearlyMilesGoal: null })
  })

  it("rejects a non-positive goal without calling the API", async () => {
    const user = userEvent.setup()
    render(<GoalEditor initialGoal={null} />)
    await user.click(screen.getByRole("button", { name: /set a yearly goal/i }))
    await user.type(screen.getByLabelText(/yearly miles goal/i), "0")
    await user.click(screen.getByRole("button", { name: /save/i }))
    expect(fetch).not.toHaveBeenCalled()
    expect(screen.getByRole("alert")).toHaveTextContent(/between 1 and 10,000/i)
  })

  it("surfaces a failed save", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "invalid_input" }), { status: 400 }),
    )
    const user = userEvent.setup()
    render(<GoalEditor initialGoal={null} />)
    await user.click(screen.getByRole("button", { name: /set a yearly goal/i }))
    await user.type(screen.getByLabelText(/yearly miles goal/i), "1200")
    await user.click(screen.getByRole("button", { name: /save/i }))
    expect(toast.error).toHaveBeenCalledWith("invalid_input")
  })

  it("reopens empty after clearing the goal", async () => {
    const user = userEvent.setup()
    render(<GoalEditor initialGoal={1095} />)
    await user.click(screen.getByRole("button", { name: /edit goal/i }))
    await user.click(screen.getByRole("button", { name: /clear goal/i }))
    await user.click(await screen.findByRole("button", { name: /edit goal|set a yearly goal/i }))
    expect(screen.getByLabelText(/yearly miles goal/i)).toHaveValue(null)
  })
})
