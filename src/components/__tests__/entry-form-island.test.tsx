import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

const VALUES = {
  speedMph: 3.5,
  inclinePct: 5,
  minutes: 30,
  distanceMi: 1.75,
  steps: 3696,
  calories: 150,
  notes: "",
}

// Submit-button stand-in so the test drives the island's handler directly.
vi.mock("../treadmill-entry-form", () => ({
  TreadmillEntryForm: ({ onSubmit }: { onSubmit: (v: unknown) => void }) => (
    <button onClick={() => onSubmit(VALUES)}>submit-stub</button>
  ),
}))

vi.mock("@/lib/offline-queue", () => ({
  enqueueWorkout: vi.fn(async () => 1),
  registerOnlineReplay: vi.fn(() => () => {}),
}))

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}))

import { EntryFormIsland } from "../entry-form-island"
import { enqueueWorkout } from "@/lib/offline-queue"
import { toast } from "sonner"

const settings = { weightLb: 180, strideIn: 28 }

function setOnline(value: boolean) {
  Object.defineProperty(window.navigator, "onLine", {
    value,
    configurable: true,
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal("fetch", vi.fn())
})

afterEach(() => {
  setOnline(true)
  vi.unstubAllGlobals()
})

describe("<EntryFormIsland> offline behavior", () => {
  it("queues the workout instead of posting when offline", async () => {
    setOnline(false)
    const user = userEvent.setup()
    render(<EntryFormIsland settings={settings} />)
    await user.click(screen.getByRole("button", { name: "submit-stub" }))

    expect(enqueueWorkout).toHaveBeenCalledWith(VALUES)
    expect(fetch).not.toHaveBeenCalled()
    expect(toast.info).toHaveBeenCalled()
  })

  it("posts normally when online", async () => {
    setOnline(true)
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ id: "x" }), { status: 201 }),
    )
    const user = userEvent.setup()
    render(<EntryFormIsland settings={settings} />)
    await user.click(screen.getByRole("button", { name: "submit-stub" }))

    expect(fetch).toHaveBeenCalledWith("/api/workouts", expect.anything())
    expect(enqueueWorkout).not.toHaveBeenCalled()
    expect(toast.success).toHaveBeenCalled()
  })
})
