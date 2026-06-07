"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SettingsForm, type SettingsValues } from "./settings-form"

interface Props {
  initial: SettingsValues
}

export function SettingsCard({ initial }: Props) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(values: SettingsValues) {
    setSubmitting(true)
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? "Save failed")
      }
      toast.success("Settings saved")
      router.refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Save failed"
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile & goals</CardTitle>
      </CardHeader>
      <CardContent>
        <SettingsForm initial={initial} onSubmit={handleSubmit} isSubmitting={submitting} />
      </CardContent>
    </Card>
  )
}
