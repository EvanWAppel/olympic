import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { SectionErrorBoundary } from "../section-error-boundary"

function Boom(): never {
  throw new Error("kaboom")
}

let errorSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  // React logs caught errors to console.error; silence it for clean output.
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
})

afterEach(() => {
  errorSpy.mockRestore()
})

describe("<SectionErrorBoundary>", () => {
  it("renders children when there is no error", () => {
    render(
      <SectionErrorBoundary name="Today">
        <p>all good</p>
      </SectionErrorBoundary>,
    )
    expect(screen.getByText("all good")).toBeInTheDocument()
  })

  it("renders a labeled fallback when a child throws", () => {
    render(
      <SectionErrorBoundary name="Weekly miles">
        <Boom />
      </SectionErrorBoundary>,
    )
    expect(screen.getByText(/weekly miles couldn’t load/i)).toBeInTheDocument()
  })

  it("isolates the failure — a sibling boundary still renders", () => {
    render(
      <div>
        <SectionErrorBoundary name="Broken">
          <Boom />
        </SectionErrorBoundary>
        <SectionErrorBoundary name="Healthy">
          <p>still here</p>
        </SectionErrorBoundary>
      </div>,
    )
    expect(screen.getByText(/broken couldn’t load/i)).toBeInTheDocument()
    expect(screen.getByText("still here")).toBeInTheDocument()
  })
})
