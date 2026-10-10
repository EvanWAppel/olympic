import { beforeAll, describe, expect, it } from "vitest"
import { config } from "dotenv"
// The page module imports the DB-backed loaders; load env for the import-time
// guard. generateMetadata itself never queries.
config({ path: ".env.local" })

let generateMetadata: typeof import("../page").generateMetadata

beforeAll(async () => {
  ;({ generateMetadata } = await import("../page"))
})

describe("recap generateMetadata", () => {
  it("titles the page and its social card after the year", async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ year: "2025" }) })
    expect(meta.title).toBe("2025 in movement — Olympic")
    expect(meta.openGraph?.title).toBe("2025 in movement — Olympic")
    expect(meta.twitter?.title).toBe("2025 in movement — Olympic")
    expect(meta.openGraph?.url).toBe("/recap/2025")
  })

  it("never echoes a non-year path segment into the title", async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ year: "Evan quit" }) })
    expect(meta.title).toBe("Year in movement — Olympic")
    expect(JSON.stringify(meta)).not.toContain("Evan quit")
  })
})
