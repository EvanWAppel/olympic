"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { upload } from "@vercel/blob/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

interface ImportResult {
  dailyMetricsUpserted: number
  workoutsUpserted: number
}

// Vercel caps request bodies at ~4.5 MB. Larger files go to Blob first, then we
// hand the import route just the URL.
const DIRECT_UPLOAD_LIMIT = 4 * 1024 * 1024

async function importViaMultipart(file: File): Promise<Response> {
  const form = new FormData()
  form.append("file", file)
  return fetch("/api/health/import", { method: "POST", body: form })
}

async function importViaBlob(file: File): Promise<Response> {
  const blob = await upload(file.name, file, {
    access: "public",
    handleUploadUrl: "/api/health/blob-upload",
  })
  return fetch("/api/health/import", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ blobUrl: blob.url }),
  })
}

export function HealthImportCard() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [lastResult, setLastResult] = useState<ImportResult | null>(null)

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file) {
      toast.error("Choose an export.zip first")
      return
    }
    setBusy(true)
    setLastResult(null)
    try {
      const res =
        file.size > DIRECT_UPLOAD_LIMIT
          ? await importViaBlob(file)
          : await importViaMultipart(file)
      const body = (await res.json().catch(() => ({}))) as
        | (ImportResult & { error?: undefined })
        | { error: string; message?: string }
      if (!res.ok) throw new Error("message" in body ? body.message ?? body.error : "Import failed")
      const result = body as ImportResult
      setLastResult(result)
      toast.success(
        `Imported ${result.dailyMetricsUpserted} day${result.dailyMetricsUpserted === 1 ? "" : "s"}, ${result.workoutsUpserted} workout${result.workoutsUpserted === 1 ? "" : "s"}`,
      )
      router.refresh()
      if (fileRef.current) fileRef.current.value = ""
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Apple Health backfill</CardTitle>
        <CardDescription>
          On iPhone: Health → profile → <em>Export All Health Data</em>. AirDrop
          the resulting <code>export.zip</code> to your laptop, then upload it
          here. Idempotent — safe to re-upload.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpload} className="grid gap-4">
          <Input
            ref={fileRef}
            type="file"
            accept=".zip,application/zip"
            disabled={busy}
            aria-label="Apple Health export zip file"
          />
          <Button type="submit" disabled={busy} className="justify-self-start">
            {busy ? "Importing…" : "Upload export.zip"}
          </Button>
          {lastResult && (
            <p className="text-sm text-muted-foreground">
              Last import: {lastResult.dailyMetricsUpserted} daily totals,{" "}
              {lastResult.workoutsUpserted} outdoor workouts.
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
