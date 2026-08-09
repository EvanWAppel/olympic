"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export interface MoodEntryValues {
  score: number
  comment?: string
}

interface Props {
  initial?: { score?: number; comment?: string }
  onSubmit: (values: MoodEntryValues) => Promise<void> | void
  isSubmitting?: boolean
  submitLabel?: string
}

const SCORES = Array.from({ length: 11 }, (_, i) => i)

export function MoodEntryForm({
  initial,
  onSubmit,
  isSubmitting,
  submitLabel,
}: Props) {
  const [score, setScore] = useState<number | null>(initial?.score ?? null)
  const [comment, setComment] = useState(initial?.comment ?? "")
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (score === null) {
      setError("Pick a number from 0 to 10")
      return
    }
    setError(null)
    const trimmed = comment.trim()
    await onSubmit({ score, ...(trimmed !== "" && { comment: trimmed }) })
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
      <div className="grid gap-2">
        <Label>How are you feeling? (0 = worst, 10 = best)</Label>
        <div
          role="radiogroup"
          aria-label="Mood score"
          className="flex flex-wrap gap-1.5"
        >
          {SCORES.map((n) => (
            <Button
              key={n}
              type="button"
              size="icon"
              variant={score === n ? "default" : "outline"}
              role="radio"
              aria-checked={score === n}
              aria-label={String(n)}
              onClick={() => {
                setScore(n)
                setError(null)
              }}
            >
              {n}
            </Button>
          ))}
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="mood-comment">Comment (optional)</Label>
        <Input
          id="mood-comment"
          type="text"
          placeholder="anything on your mind"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : (submitLabel ?? "Save mood")}
      </Button>
    </form>
  )
}
