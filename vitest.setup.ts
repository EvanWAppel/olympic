import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterEach, vi } from "vitest"
import dns from "node:dns"
import net from "node:net"

// The IPv6 route to Neon is unreliable on some networks and Node's fetch
// doesn't fall back to IPv4 the way curl does, so DB tests stall or fail
// with UND_ERR_CONNECT_TIMEOUT without this. The default 250ms per-address
// attempt window is also too tight when latency spikes.
dns.setDefaultResultOrder("ipv4first")
net.setDefaultAutoSelectFamilyAttemptTimeout(2000)

// jsdom doesn't implement ResizeObserver — Recharts' ResponsiveContainer
// needs it to render with non-zero dimensions in tests.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
;(globalThis as unknown as { ResizeObserver: typeof ResizeObserverStub }).ResizeObserver =
  ResizeObserverStub

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}))

afterEach(() => {
  cleanup()
})
