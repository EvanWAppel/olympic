import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

const replace = vi.fn()
const refresh = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh }),
}))

const startAuthentication = vi.fn()
const startRegistration = vi.fn()
vi.mock("@simplewebauthn/browser", () => ({
  startAuthentication: (...args: unknown[]) => startAuthentication(...args),
  startRegistration: (...args: unknown[]) => startRegistration(...args),
}))

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import { LoginPanel } from "../login-panel"

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function stubFetch(map: Record<string, { ok: boolean; json?: unknown }>) {
  const fetchMock = vi.fn(async (url: string) => {
    const entry = map[url]
    if (!entry) throw new Error(`unexpected fetch ${url}`)
    return {
      ok: entry.ok,
      json: async () => entry.json ?? {},
    } as Response
  })
  vi.stubGlobal("fetch", fetchMock)
  return fetchMock
}

describe("<LoginPanel>", () => {
  it("runs the passkey login flow and redirects on success", async () => {
    const fetchMock = stubFetch({
      "/api/auth/login/options": { ok: true, json: { challenge: "abc" } },
      "/api/auth/login/verify": { ok: true, json: { verified: true } },
    })
    startAuthentication.mockResolvedValue({ id: "cred-1" })
    const user = userEvent.setup()

    render(<LoginPanel />)
    await user.click(screen.getByRole("button", { name: /log in/i }))

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/login/options",
      expect.objectContaining({ method: "POST" }),
    )
    expect(startAuthentication).toHaveBeenCalledWith({
      optionsJSON: { challenge: "abc" },
    })
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/login/verify",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ response: { id: "cred-1" } }),
      }),
    )
    expect(replace).toHaveBeenCalledWith("/")
  })

  it("does not redirect when verification fails", async () => {
    stubFetch({
      "/api/auth/login/options": { ok: true, json: { challenge: "abc" } },
      "/api/auth/login/verify": { ok: false },
    })
    startAuthentication.mockResolvedValue({ id: "cred-1" })
    const user = userEvent.setup()

    render(<LoginPanel />)
    await user.click(screen.getByRole("button", { name: /log in/i }))

    expect(replace).not.toHaveBeenCalled()
  })

  it("registers a device using the bootstrap secret", async () => {
    const fetchMock = stubFetch({
      "/api/auth/register/options": { ok: true, json: { challenge: "reg" } },
      "/api/auth/register/verify": { ok: true, json: { verified: true } },
    })
    startRegistration.mockResolvedValue({ id: "new-cred" })
    const user = userEvent.setup()

    render(<LoginPanel />)
    // Reveal the register form.
    await user.click(screen.getByRole("button", { name: /register a device/i }))
    await user.type(screen.getByLabelText(/bootstrap secret/i), "the-secret")
    await user.click(screen.getByRole("button", { name: /^register$/i }))

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/register/options",
      expect.objectContaining({
        headers: expect.objectContaining({ "x-bootstrap-secret": "the-secret" }),
      }),
    )
    expect(startRegistration).toHaveBeenCalledWith({
      optionsJSON: { challenge: "reg" },
    })
    expect(replace).toHaveBeenCalledWith("/")
  })
})
