import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MoodEntryForm } from "../mood-entry-form"

describe("<MoodEntryForm>", () => {
  it("renders 0–10 score options, a comment field, and a save button", () => {
    render(<MoodEntryForm onSubmit={vi.fn()} />)
    for (let n = 0; n <= 10; n++) {
      expect(screen.getByRole("radio", { name: String(n) })).toBeInTheDocument()
    }
    expect(screen.getByLabelText(/comment/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument()
  })

  it("submits the chosen score with no comment", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<MoodEntryForm onSubmit={onSubmit} />)

    await user.click(screen.getByRole("radio", { name: "7" }))
    await user.click(screen.getByRole("button", { name: /save/i }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit.mock.calls[0][0]).toEqual({ score: 7 })
  })

  it("includes a trimmed comment when provided", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<MoodEntryForm onSubmit={onSubmit} />)

    await user.click(screen.getByRole("radio", { name: "3" }))
    await user.type(screen.getByLabelText(/comment/i), "  rough day  ")
    await user.click(screen.getByRole("button", { name: /save/i }))

    expect(onSubmit).toHaveBeenCalledWith({ score: 3, comment: "rough day" })
  })

  it("allows a score of 0", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<MoodEntryForm onSubmit={onSubmit} />)

    await user.click(screen.getByRole("radio", { name: "0" }))
    await user.click(screen.getByRole("button", { name: /save/i }))

    expect(onSubmit).toHaveBeenCalledWith({ score: 0 })
  })

  it("blocks submit until a score is chosen", async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<MoodEntryForm onSubmit={onSubmit} />)

    await user.click(screen.getByRole("button", { name: /save/i }))
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("pre-fills from an existing entry", () => {
    render(
      <MoodEntryForm
        initial={{ score: 8, comment: "good" }}
        onSubmit={vi.fn()}
      />,
    )
    expect(screen.getByRole("radio", { name: "8" })).toBeChecked()
    expect(screen.getByLabelText(/comment/i)).toHaveValue("good")
  })
})
