import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

const uploadMock = vi.fn(async (..._args: unknown[]) => ({
  url: "https://blob.example.com/export-xyz.zip",
}))
vi.mock("@vercel/blob/client", () => ({
  upload: (...args: unknown[]) => uploadMock(...args),
}))

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import { HealthImportCard } from "../health-import-card"

function makeFile(name: string, sizeBytes: number): File {
  const file = new File(["x"], name, { type: "application/zip" })
  Object.defineProperty(file, "size", { value: sizeBytes })
  return file
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      new Response(
        JSON.stringify({ dailyMetricsUpserted: 5, workoutsUpserted: 1 }),
        { status: 200 },
      ),
    ),
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("<HealthImportCard>", () => {
  it("renders title, instructions, and upload button", () => {
    render(<HealthImportCard />)
    expect(screen.getByText(/apple health backfill/i)).toBeInTheDocument()
    expect(screen.getByText(/export all health data/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /upload/i })).toBeInTheDocument()
  })

  it("uploads a small file directly via multipart (no Blob)", async () => {
    const user = userEvent.setup()
    render(<HealthImportCard />)
    await user.upload(
      screen.getByLabelText(/export zip file/i),
      makeFile("small.zip", 1 * 1024 * 1024),
    )
    await user.click(screen.getByRole("button", { name: /upload/i }))

    expect(uploadMock).not.toHaveBeenCalled()
    const [, init] = vi.mocked(fetch).mock.calls[0]
    expect(init?.body).toBeInstanceOf(FormData)
  })

  it("routes a large file through Vercel Blob, then posts the blob URL", async () => {
    const user = userEvent.setup()
    render(<HealthImportCard />)
    await user.upload(
      screen.getByLabelText(/export zip file/i),
      makeFile("big.zip", 6 * 1024 * 1024),
    )
    await user.click(screen.getByRole("button", { name: /upload/i }))

    expect(uploadMock).toHaveBeenCalledTimes(1)
    const [, init] = vi.mocked(fetch).mock.calls[0]
    expect(init?.headers).toMatchObject({ "content-type": "application/json" })
    expect(JSON.parse(init?.body as string)).toEqual({
      blobUrl: "https://blob.example.com/export-xyz.zip",
    })
  })
})
