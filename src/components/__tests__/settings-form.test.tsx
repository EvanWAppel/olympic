import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { SettingsForm } from "../settings-form"

const defaults = {
  weightLb: 170,
  strideIn: 28,
  dailyStepGoal: 10_000,
  weeklyMilesGoal: 20,
  timezone: "America/New_York",
}

describe("<SettingsForm>", () => {
  it("renders fields pre-filled with initial values", () => {
    render(<SettingsForm initial={defaults} onSubmit={vi.fn()} />)
    expect(screen.getByLabelText(/weight/i)).toHaveValue(170)
    expect(screen.getByLabelText(/stride/i)).toHaveValue(28)
    expect(screen.getByLabelText(/daily step goal/i)).toHaveValue(10_000)
    expect(screen.getByLabelText(/weekly miles goal/i)).toHaveValue(20)
    expect(screen.getByLabelText(/timezone/i)).toHaveValue("America/New_York")
  })

  it("submits parsed numeric values", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<SettingsForm initial={defaults} onSubmit={onSubmit} />)

    const weight = screen.getByLabelText(/weight/i)
    await user.clear(weight)
    await user.type(weight, "185")
    await user.click(screen.getByRole("button", { name: /save/i }))

    expect(onSubmit).toHaveBeenCalledWith({
      weightLb: 185,
      strideIn: 28,
      dailyStepGoal: 10_000,
      weeklyMilesGoal: 20,
      timezone: "America/New_York",
    })
  })

  it("blocks submit on invalid weight", async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<SettingsForm initial={defaults} onSubmit={onSubmit} />)

    const weight = screen.getByLabelText(/weight/i)
    await user.clear(weight)
    await user.type(weight, "-5")
    await user.click(screen.getByRole("button", { name: /save/i }))

    expect(onSubmit).not.toHaveBeenCalled()
  })
})
