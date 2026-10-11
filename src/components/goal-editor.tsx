"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const MAX_GOAL = 10_000

/** Owner-only inline control for the yearly miles goal on the goal card. */
export function GoalEditor({ initialGoal }: { initialGoal: number | null }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(initialGoal === null ? "" : String(initialGoal))
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function save(goal: number | null) {
    setSaving(true)
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ yearlyMilesGoal: goal }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? "Save failed")
      }
      toast.success(goal === null ? "Goal cleared" : "Goal saved")
      setEditing(false)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const goal = Number(value)
    if (!Number.isFinite(goal) || goal < 1 || goal > MAX_GOAL) {
      setError(`Enter a goal between 1 and ${MAX_GOAL.toLocaleString("en-US")} miles.`)
      return
    }
    setError(null)
    void save(goal)
  }

  if (!editing) {
    return (
      <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
        {initialGoal === null ? "Set a yearly goal" : "Edit goal"}
      </Button>
    )
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-2" noValidate>
      <div className="flex flex-col gap-1">
        <Label htmlFor="yearly-miles-goal">Yearly miles goal</Label>
        <Input
          id="yearly-miles-goal"
          type="number"
          inputMode="decimal"
          min={1}
          max={MAX_GOAL}
          step="any"
          className="w-32"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-invalid={error !== null}
          aria-describedby={error ? "yearly-miles-goal-error" : undefined}
        />
      </div>
      <Button type="submit" size="sm" disabled={saving}>Save</Button>
      {initialGoal !== null && (
        <Button type="button" variant="ghost" size="sm" disabled={saving} onClick={() => save(null)}>
          Clear goal
        </Button>
      )}
      <Button type="button" variant="ghost" size="sm" disabled={saving} onClick={() => setEditing(false)}>
        Cancel
      </Button>
      {error && (
        <p id="yearly-miles-goal-error" role="alert" className="w-full text-xs text-destructive">
          {error}
        </p>
      )}
    </form>
  )
}
