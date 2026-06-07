import { NextResponse } from "next/server"
import AdmZip from "adm-zip"
import { parseHealthExport } from "@/lib/health-import/parse"
import { importHealthData } from "@/lib/health-import/import"
import { getSettings } from "@/db/settings.repo"

export const runtime = "nodejs"
export const maxDuration = 300 // seconds

export async function POST(req: Request) {
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
  let xml: string
  try {
    const zip = new AdmZip(buffer)
    const entry = zip
      .getEntries()
      .find((e) => /(^|\/)export\.xml$/i.test(e.entryName))
    if (!entry) {
      return NextResponse.json(
        { error: "missing_export_xml", message: "could not find apple_health_export/export.xml in zip" },
        { status: 400 },
      )
    }
    xml = entry.getData().toString("utf-8")
  } catch {
    return NextResponse.json(
      { error: "invalid_zip", message: "could not read uploaded file as a zip" },
      { status: 400 },
    )
  }

  const settings = await getSettings()
  const parsed = await parseHealthExport(xml, settings.timezone)
  const result = await importHealthData(parsed)

  return NextResponse.json(result)
}
