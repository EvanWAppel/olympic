"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { TreadmillEntryForm, type TreadmillEntryValues } from "./treadmill-entry-form"
import { enqueueWorkout, registerOnlineReplay } from "@/lib/offline-queue"

interface Props {
  settings: { weightLb: number; strideIn: number }
}

async function postWorkout(payload: unknown): Promise<boolean> {
  const res = await fetch("/api/workouts", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  })
  return res.ok
}

export function EntryFormIsland({ settings }: Props) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  // Flush any queued workouts when connectivity returns.
  useEffect(() => {
    return registerOnlineReplay(postWorkout, (replayed) => {
      toast.success(
        `Synced ${replayed} queued workout${replayed === 1 ? "" : "s"}`,
      )
      router.refresh()
    })
  }, [router])

  async function handleSubmit(values: TreadmillEntryValues) {
    setSubmitting(true)
    try {
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        await enqueueWorkout(values)
        toast.info("Offline — workout queued, will sync when you reconnect")
        return
      }
      const res = await fetch("/api/workouts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? "Save failed")
      }
      toast.success("Workout saved")
      router.refresh()
    } catch (err) {
      // A network failure mid-submit (online flag stale) — queue rather than lose it.
      if (err instanceof TypeError) {
        await enqueueWorkout(values)
        toast.info("Connection lost — workout queued, will sync when you reconnect")
        return
      }
      const message = err instanceof Error ? err.message : "Save failed"
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <TreadmillEntryForm
      settings={settings}
      onSubmit={handleSubmit}
      isSubmitting={submitting}
    />
  )
}
