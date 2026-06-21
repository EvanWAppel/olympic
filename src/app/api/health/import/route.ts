import { NextResponse } from "next/server"
import AdmZip from "adm-zip"
import { parseHealthExport } from "@/lib/health-import/parse"
import { importHealthData } from "@/lib/health-import/import"
import { getSettings } from "@/db/settings.repo"

export const runtime = "nodejs"
export const maxDuration = 300 // seconds

interface Failure {
  ok: false
  status: number
  error: string
  message: string
}

/**
 * Unzip → find export.xml → parse → import. Shared by both the multipart path
 * (small files posted directly) and the Blob path (large files fetched from a
 * Vercel Blob URL, bypassing the ~4.5 MB request-body limit).
 */
async function importFromZipBuffer(
  buffer: Buffer,
): Promise<
  | { ok: true; dailyMetricsUpserted: number; workoutsUpserted: number }
  | Failure
> {
  let xml: string
  try {
    const zip = new AdmZip(buffer)
    const entry = zip
      .getEntries()
      .find((e) => /(^|\/)export\.xml$/i.test(e.entryName))
    if (!entry) {
      return {
        ok: false,
        status: 400,
        error: "missing_export_xml",
        message: "could not find apple_health_export/export.xml in zip",
      }
    }
    xml = entry.getData().toString("utf-8")
  } catch {
    return {
      ok: false,
      status: 400,
      error: "invalid_zip",
      message: "could not read uploaded file as a zip",
    }
  }

  const settings = await getSettings()
  const parsed = await parseHealthExport(xml, settings.timezone)
  const result = await importHealthData(parsed)
  return { ok: true, ...result }
}

export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") ?? ""

  // Blob path: JSON body with { blobUrl } — file already uploaded to Vercel Blob.
  if (contentType.includes("application/json")) {
    let blobUrl: string
    try {
      const body = (await req.json()) as { blobUrl?: unknown }
      if (typeof body.blobUrl !== "string" || body.blobUrl.length === 0) {
        throw new Error("missing blobUrl")
      }
      blobUrl = body.blobUrl
    } catch {
      return NextResponse.json(
        { error: "invalid_body", message: "expected JSON { blobUrl }" },
        { status: 400 },
      )
    }

    let buffer: Buffer
    try {
      const res = await fetch(blobUrl)
      if (!res.ok) throw new Error(`blob fetch failed: ${res.status}`)
      buffer = Buffer.from(await res.arrayBuffer())
    } catch {
      return NextResponse.json(
        { error: "blob_fetch_failed", message: "could not download the blob" },
        { status: 400 },
      )
    }

    const result = await importFromZipBuffer(buffer)
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, message: result.message },
        { status: result.status },
      )
    }
    return NextResponse.json({
      dailyMetricsUpserted: result.dailyMetricsUpserted,
      workoutsUpserted: result.workoutsUpserted,
    })
  }

  // Multipart path: small files posted directly as form-data.
  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json(
      { error: "invalid_body", message: "expected multipart form-data" },
      { status: 400 },
    )
  }

  const file = form.get("file")
  if (!(file instanceof Blob) || file.size === 0) {
    return NextResponse.json(
      { error: "missing_file", message: "expected a 'file' field with the Apple Health export zip" },
      { status: 400 },
    )
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const result = await importFromZipBuffer(buffer)
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, message: result.message },
      { status: result.status },
    )
  }
  return NextResponse.json({
    dailyMetricsUpserted: result.dailyMetricsUpserted,
    workoutsUpserted: result.workoutsUpserted,
  })
}
