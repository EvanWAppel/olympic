"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { MoodEntryForm, type MoodEntryValues } from "./mood-entry-form"

interface Props {
  initial?: { score?: number; comment?: string }
}

export function MoodCardIsland({ initial }: Props) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const alreadyLogged = initial?.score !== undefined

  async function handleSubmit(values: MoodEntryValues) {
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
      toast.success("Mood saved")
      router.refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Save failed"
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <MoodEntryForm
      initial={initial}
      onSubmit={handleSubmit}
      isSubmitting={submitting}
      submitLabel={alreadyLogged ? "Update mood" : "Save mood"}
    />
  )
}
