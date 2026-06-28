"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { MoodForm, type MoodValues } from "./mood-form"

export function MoodFormIsland() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(values: MoodValues) {
    setSubmitting(true)
    try {
      const res = await fetch("/api/mood", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? "Save failed")
      }
      toast.success("Check-in saved")
      router.refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Save failed"
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return <MoodForm onSubmit={handleSubmit} isSubmitting={submitting} />
}
