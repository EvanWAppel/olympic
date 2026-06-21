"use client"

import { useState, useSyncExternalStore } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

interface Props {
  initialSecret: string
}

function maskSecret(secret: string): string {
  if (secret.length <= 8) return "•".repeat(secret.length)
  return secret.slice(0, 4) + "•".repeat(secret.length - 8) + secret.slice(-4)
}

export function HealthIngestCard({ initialSecret }: Props) {
  const [secret, setSecret] = useState(initialSecret)
  const [showSecret, setShowSecret] = useState(false)
  const [busy, setBusy] = useState(false)
  // Hydration-safe read of a client-only value: "" on the server, the real
  // origin after hydration.
  const origin = useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => "",
  )

  const ingestUrl = origin ? `${origin}/api/health/ingest` : "/api/health/ingest"

  async function copy(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value)
      toast.success(`${label} copied`)
    } catch {
      toast.error(`Could not copy ${label}`)
    }
  }

  async function rotate() {
    if (!confirm("Rotate ingest secret? The old token will stop working immediately.")) {
      return
    }
    setBusy(true)
    try {
      const res = await fetch("/api/health/secret", { method: "POST" })
      if (!res.ok) throw new Error("Rotation failed")
      const body = (await res.json()) as { secret: string }
      setSecret(body.secret)
      setShowSecret(true)
      toast.success("New secret generated — update your phone")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Rotation failed")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Apple Health auto-sync</CardTitle>
        <CardDescription>
          Configure the iOS{" "}
          <a
            className="underline underline-offset-4"
            href="https://apps.apple.com/us/app/health-auto-export-json-csv/id1115567069"
            target="_blank"
            rel="noreferrer"
          >
            Health Auto Export
          </a>{" "}
          app with the URL and bearer token below. Schedule a daily JSON POST
          to keep this dashboard in sync with your phone.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <label htmlFor="ingest-endpoint-url" className="text-sm font-medium">
            Endpoint URL
          </label>
          <div className="flex gap-2">
            <Input
              id="ingest-endpoint-url"
              readOnly
              value={ingestUrl}
              className="font-mono text-xs"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => copy(ingestUrl, "URL")}
              disabled={!origin}
            >
              Copy
            </Button>
          </div>
        </div>

        <div className="grid gap-2">
          <label htmlFor="ingest-bearer-token" className="text-sm font-medium">
            Bearer token
          </label>
          <div className="flex gap-2">
            <Input
              id="ingest-bearer-token"
              readOnly
              value={showSecret ? secret : maskSecret(secret)}
              className="font-mono text-xs"
            />
            <Button type="button" variant="outline" onClick={() => setShowSecret((v) => !v)}>
              {showSecret ? "Hide" : "Show"}
            </Button>
            <Button type="button" variant="outline" onClick={() => copy(secret, "Secret")}>
              Copy
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Send as <code className="font-mono">Authorization: Bearer &lt;token&gt;</code>.
          </p>
        </div>

        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={rotate} disabled={busy}>
            {busy ? "Rotating…" : "Rotate secret"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
