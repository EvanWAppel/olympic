import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterEach, vi } from "vitest"
import { neonConfig } from "@neondatabase/serverless"
import dns from "node:dns"
import net from "node:net"

// When NEON_LOCAL_PROXY_URL is set (CI and local `docker compose -f
// docker-compose.test.yml up`), route the Neon HTTP driver at a local proxy
// in front of a throwaway Postgres, so the DB-integration tests run without a
// remote Neon branch. Guarded by the env var, so a real Neon host is never
// affected.
if (process.env.NEON_LOCAL_PROXY_URL) {
  neonConfig.fetchEndpoint = () => process.env.NEON_LOCAL_PROXY_URL as string
}

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
