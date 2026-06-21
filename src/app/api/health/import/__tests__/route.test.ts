// @vitest-environment node
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest"
import { config } from "dotenv"
import { readFile } from "node:fs/promises"
import path from "node:path"
import AdmZip from "adm-zip"

config({ path: ".env.local" })

let POST: (req: Request) => Promise<Response>
let db: typeof import("@/db/client").db
let workouts: typeof import("@/db/schema").workouts
let dailyMetric: typeof import("@/db/schema").dailyMetric
let inArray: typeof import("drizzle-orm").inArray

const FIXTURE = path.join(__dirname, "../../../../../lib/health-import/__fixtures__/sample-export.xml")
const FIXTURE_DATES = ["2026-05-29", "2026-05-30", "2026-05-31"]
const FIXTURE_EXTERNAL_IDS = ["walk-uuid-001"]

beforeAll(async () => {
  POST = (await import("../route")).POST as never
  db = (await import("@/db/client")).db
  workouts = (await import("@/db/schema")).workouts
  dailyMetric = (await import("@/db/schema")).dailyMetric
  inArray = (await import("drizzle-orm")).inArray
})

afterEach(async () => {
  await db.delete(dailyMetric).where(inArray(dailyMetric.date, FIXTURE_DATES))
  await db.delete(workouts).where(inArray(workouts.externalId, FIXTURE_EXTERNAL_IDS))
})

async function buildZip(): Promise<Blob> {
  const xml = await readFile(FIXTURE, "utf-8")
  const zip = new AdmZip()
  zip.addFile("apple_health_export/export.xml", Buffer.from(xml, "utf-8"))
  return new Blob([zip.toBuffer() as unknown as ArrayBuffer], { type: "application/zip" })
}

async function buildRequest(file: Blob): Promise<Request> {
  const form = new FormData()
  form.append("file", file, "export.zip")
  return new Request("http://localhost/api/health/import", {
    method: "POST",
    body: form,
  })
}

describe("POST /api/health/import", () => {
  it("accepts a zipped export and returns counts", async () => {
    const res = await POST(await buildRequest(await buildZip()))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.dailyMetricsUpserted).toBe(3)
    expect(body.workoutsUpserted).toBe(1)
  })

  it("returns 400 when no file is uploaded", async () => {
    const form = new FormData()
    const req = new Request("http://localhost/api/health/import", {
      method: "POST",
      body: form,
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it("returns 400 when the zip has no export.xml", async () => {
    const zip = new AdmZip()
    zip.addFile("readme.txt", Buffer.from("nope", "utf-8"))
    const blob = new Blob([zip.toBuffer() as unknown as ArrayBuffer], { type: "application/zip" })
    const res = await POST(await buildRequest(blob))
    expect(res.status).toBe(400)
  })

  it("accepts a JSON { blobUrl } body and imports the fetched zip", async () => {
    const xml = await readFile(FIXTURE, "utf-8")
    const zip = new AdmZip()
    zip.addFile("apple_health_export/export.xml", Buffer.from(xml, "utf-8"))
    const zipBuffer = zip.toBuffer()
    const BLOB_URL = "https://blob.example.com/health/export-abc.zip"

    // Selective fetch mock: serve the blob URL, pass everything else (Neon's
    // own HTTP driver uses fetch) through to the real implementation.
    const realFetch = globalThis.fetch
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockImplementation((input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
        if (input === BLOB_URL) {
          return Promise.resolve(
            new Response(new Uint8Array(zipBuffer), { status: 200 }),
          )
        }
        return realFetch(input, init)
      })
    vi.stubGlobal("fetch", fetchMock)
    try {
      const req = new Request("http://localhost/api/health/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ blobUrl: BLOB_URL }),
      })
      const res = await POST(req)
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.dailyMetricsUpserted).toBe(3)
      expect(body.workoutsUpserted).toBe(1)
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it("returns 400 for a JSON body missing blobUrl", async () => {
    const req = new Request("http://localhost/api/health/import", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
