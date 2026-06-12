"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { TreadmillEntryForm, type TreadmillEntryValues } from "./treadmill-entry-form"

type Workout = {
  id: string
  source: "treadmill" | "outdoor"
  startAt: string | Date
  endAt: string | Date
  minutes: string | number
  speedMph: string | number | null
  inclinePct: string | number | null
  distanceMi: string | number
  steps: number | null
  calories: string | number | null
  notes: string | null
  externalId?: string | null
  createdAt: string | Date
  updatedAt: string | Date
}

interface Props {
  workouts: Workout[]
  settings: { weightLb: number; strideIn: number }
}

function fmtNum(value: string | number | null, digits = 2): string {
  if (value === null || value === undefined) return "—"
  return Number(value).toFixed(digits)
}

const PAGE_SIZE = 50

type SourceFilter = "all" | "treadmill" | "outdoor"

const FILTERS: Array<{ value: SourceFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "treadmill", label: "Treadmill" },
  { value: "outdoor", label: "Outdoor" },
]

export function WorkoutList({ workouts, settings }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState<Workout | null>(null)
  const [deleting, setDeleting] = useState<Workout | null>(null)
  const [busy, setBusy] = useState(false)
  const [filter, setFilter] = useState<SourceFilter>("all")
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  if (workouts.length === 0) {
    return <p className="text-sm text-muted-foreground">No workouts logged yet.</p>
  }

  const filtered =
    filter === "all" ? workouts : workouts.filter((w) => w.source === filter)
  const visible = filtered.slice(0, visibleCount)

  function selectFilter(value: SourceFilter) {
    setFilter(value)
    setVisibleCount(PAGE_SIZE)
  }

  async function handleEditSubmit(values: TreadmillEntryValues) {
    if (!editing) return
    setBusy(true)
    try {
      const res = await fetch(`/api/workouts/${editing.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Failed")
      toast.success("Workout updated")
      setEditing(null)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed")
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    if (!deleting) return
    setBusy(true)
    try {
      const res = await fetch(`/api/workouts/${deleting.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Failed")
      toast.success("Workout deleted")
      setDeleting(null)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed")
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="flex gap-2">
        {FILTERS.map(({ value, label }) => (
          <Button
            key={value}
            size="sm"
            variant={filter === value ? "default" : "outline"}
            onClick={() => selectFilter(value)}
            aria-pressed={filter === value}
          >
            {label}
          </Button>
        ))}
      </div>

      <ul className="divide-y divide-border text-sm">
        {visible.map((w) => (
          <li
            key={w.id}
            className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {new Date(w.startAt).toLocaleString()}
                </span>
                <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs uppercase tracking-wide text-muted-foreground">
                  {w.source}
                </span>
              </div>
              <div className="text-muted-foreground">
                {w.source === "treadmill" ? (
                  <>
                    {fmtNum(w.speedMph, 1)} mph @ {fmtNum(w.inclinePct, 1)}% ·{" "}
                  </>
                ) : null}
                {fmtNum(w.distanceMi, 2)} mi · {fmtNum(w.minutes, 0)} min
                {w.calories !== null && <> · {fmtNum(w.calories, 0)} kcal</>}
                {w.steps !== null && <> · {w.steps.toLocaleString()} steps</>}
              </div>
              {w.notes && (
                <p className="text-muted-foreground italic">{w.notes}</p>
              )}
            </div>
            <div className="flex gap-2 sm:flex-shrink-0">
              {w.source === "treadmill" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditing(w)}
                  aria-label={`Edit workout from ${new Date(w.startAt).toLocaleString()}`}
                >
                  Edit
                </Button>
              )}
              {w.source !== "treadmill" && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled
                  aria-label="Edit (outdoor workouts come from Apple Health)"
                  title="Outdoor workouts come from Apple Health"
                >
                  Edit
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setDeleting(w)}
                aria-label={`Delete workout from ${new Date(w.startAt).toLocaleString()}`}
              >
                Delete
              </Button>
            </div>
          </li>
        ))}
      </ul>

      {filtered.length > visibleCount && (
        <div className="flex justify-center pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
          >
            Load more ({filtered.length - visibleCount} remaining)
          </Button>
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit workout</DialogTitle>
            <DialogDescription>
              Updates the workout and recomputes derived totals.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <TreadmillEntryForm
              settings={settings}
              isSubmitting={busy}
              submitLabel="Update"
              initial={{
                speedMph: String(editing.speedMph ?? ""),
                inclinePct: String(editing.inclinePct ?? ""),
                minutes: String(editing.minutes ?? ""),
                notes: editing.notes ?? "",
              }}
              onSubmit={handleEditSubmit}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this workout?</DialogTitle>
            <DialogDescription>
              {deleting &&
                `Workout on ${new Date(deleting.startAt).toLocaleString()} will be permanently removed.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={handleDelete} disabled={busy}>
              {busy ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
