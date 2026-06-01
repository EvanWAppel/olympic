import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { TreadmillEntryForm } from "../treadmill-entry-form"

describe("<TreadmillEntryForm>", () => {
  it("renders speed, incline, minutes fields and a save button", () => {
    render(<TreadmillEntryForm onSubmit={vi.fn()} />)
    expect(screen.getByLabelText(/speed/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/incline/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/minutes/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument()
  })

  it("calls onSubmit with parsed numeric values", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<TreadmillEntryForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText(/speed/i), "3.5")
    await user.type(screen.getByLabelText(/incline/i), "5")
    await user.type(screen.getByLabelText(/minutes/i), "45")
    await user.click(screen.getByRole("button", { name: /save/i }))

    expect(onSubmit).toHaveBeenCalledWith({
      speedMph: 3.5,
      inclinePct: 5,
      minutes: 45,
    })
  })

  it("shows validation error when minutes is empty", async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<TreadmillEntryForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText(/speed/i), "3.5")
    await user.type(screen.getByLabelText(/incline/i), "0")
    await user.click(screen.getByRole("button", { name: /save/i }))

    expect(onSubmit).not.toHaveBeenCalled()
  })
})
