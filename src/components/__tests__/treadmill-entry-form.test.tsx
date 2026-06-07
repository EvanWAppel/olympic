import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { TreadmillEntryForm } from "../treadmill-entry-form"

const settings = {
  weightLb: 180,
  strideIn: 28,
}

describe("<TreadmillEntryForm>", () => {
  it("renders speed, incline, minutes, notes fields and a save button", () => {
    render(<TreadmillEntryForm settings={settings} onSubmit={vi.fn()} />)
    expect(screen.getByLabelText(/speed/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/incline/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/minutes/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/notes/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument()
  })

  it("calls onSubmit with computed distance/steps/calories", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<TreadmillEntryForm settings={settings} onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText(/speed/i), "3.5")
    await user.type(screen.getByLabelText(/incline/i), "5")
    await user.type(screen.getByLabelText(/minutes/i), "45")
    await user.click(screen.getByRole("button", { name: /save/i }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    const arg = onSubmit.mock.calls[0][0]
    expect(arg.speedMph).toBe(3.5)
    expect(arg.inclinePct).toBe(5)
    expect(arg.minutes).toBe(45)
    expect(arg.distanceMi).toBeCloseTo(2.625, 3)
    expect(arg.steps).toBe(Math.round(2.625 * (63360 / 28)))
    // ACSM: 3.5 mph 5% incline 45min 180lb → roughly 270-290 kcal
    expect(arg.calories).toBeGreaterThan(200)
    expect(arg.calories).toBeLessThan(400)
    expect(arg.notes).toBeUndefined()
  })

  it("passes notes when provided", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<TreadmillEntryForm settings={settings} onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText(/speed/i), "3.5")
    await user.type(screen.getByLabelText(/incline/i), "0")
    await user.type(screen.getByLabelText(/minutes/i), "30")
    await user.type(screen.getByLabelText(/notes/i), "felt great")
    await user.click(screen.getByRole("button", { name: /save/i }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit.mock.calls[0][0].notes).toBe("felt great")
  })

  it("blocks submit when minutes is empty", async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<TreadmillEntryForm settings={settings} onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText(/speed/i), "3.5")
    await user.type(screen.getByLabelText(/incline/i), "0")
    await user.click(screen.getByRole("button", { name: /save/i }))

    expect(onSubmit).not.toHaveBeenCalled()
  })
})
