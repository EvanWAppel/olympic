"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { TreadmillEntryForm, type TreadmillEntryValues } from "./treadmill-entry-form"

export function EntryFormIsland() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(values: TreadmillEntryValues) {
    setSubmitting(true)
    try {
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
      const message = err instanceof Error ? err.message : "Save failed"
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return <TreadmillEntryForm onSubmit={handleSubmit} isSubmitting={submitting} />
}
