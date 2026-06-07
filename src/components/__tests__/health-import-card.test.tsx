import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { HealthImportCard } from "../health-import-card"

describe("<HealthImportCard>", () => {
  it("renders title, instructions, and upload button", () => {
    render(<HealthImportCard />)
    expect(screen.getByText(/apple health backfill/i)).toBeInTheDocument()
    expect(screen.getByText(/export all health data/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /upload/i })).toBeInTheDocument()
  })
})
