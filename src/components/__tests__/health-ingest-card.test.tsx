import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { HealthIngestCard } from "../health-ingest-card"

describe("<HealthIngestCard>", () => {
  it("renders endpoint URL and masked secret with copy controls", () => {
    render(<HealthIngestCard initialSecret="abcdefghijklmnop" />)
    expect(screen.getByText(/apple health auto-sync/i)).toBeInTheDocument()
    expect(screen.getByDisplayValue(/\/api\/health\/ingest/i)).toBeInTheDocument()
    // masked: first 4 + middle dots + last 4
    expect(screen.getByDisplayValue(/abcd•+mnop/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /rotate/i })).toBeInTheDocument()
  })
})
