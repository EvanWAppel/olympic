import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MoodForm } from "../mood-form"

describe("<MoodForm>", () => {
  it("renders a 1-10 scale, a comment field, and a save button", () => {
    render(<MoodForm onSubmit={vi.fn()} />)
    for (let n = 1; n <= 10; n++) {
      expect(screen.getByRole("radio", { name: String(n) })).toBeInTheDocument()
    }
    expect(screen.getByLabelText(/comment/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument()
  })

  it("submits the chosen score", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<MoodForm onSubmit={onSubmit} />)

    await user.click(screen.getByRole("radio", { name: "7" }))
    await user.click(screen.getByRole("button", { name: /save/i }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit.mock.calls[0][0]).toEqual({ score: 7 })
  })

  it("passes the comment when provided", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<MoodForm onSubmit={onSubmit} />)

    await user.click(screen.getByRole("radio", { name: "4" }))
    await user.type(screen.getByLabelText(/comment/i), "tired today")
    await user.click(screen.getByRole("button", { name: /save/i }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit.mock.calls[0][0]).toEqual({ score: 4, comment: "tired today" })
  })

  it("blocks submit until a score is picked", async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<MoodForm onSubmit={onSubmit} />)

    await user.click(screen.getByRole("button", { name: /save/i }))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(await screen.findByText(/1 to 10/i)).toBeInTheDocument()
  })
})
