"use client"

import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { computeCalories, computeDistance, computeSteps } from "@/lib/calc"

export interface TreadmillEntryValues {
  speedMph: number
  inclinePct: number
  minutes: number
  distanceMi: number
  steps: number
  calories: number
  /** Local calendar day the workout happened, YYYY-MM-DD. Defaults to today. */
  date: string
  notes?: string
}

interface FormFields {
  speedMph: string
  inclinePct: string
  minutes: string
  date: string
  notes: string
}

interface BodySettings {
  weightLb: number
  strideIn: number
}

interface Props {
  settings: BodySettings
  onSubmit: (values: TreadmillEntryValues) => Promise<void> | void
  isSubmitting?: boolean
  initial?: Partial<FormFields>
  submitLabel?: string
  /** Today's local date (YYYY-MM-DD) used as the default and max for the date field. */
  today?: string
}

/** Today's YYYY-MM-DD in the browser's local zone — fallback when `today` isn't provided. */
function browserToday(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function parsePositive(value: string, label: string, max: number): string | number {
  if (value.trim() === "") return `${label} is required`
  const n = Number(value)
  if (!Number.isFinite(n)) return `${label} must be a number`
  if (n <= 0) return `${label} must be greater than 0`
  if (n > max) return `${label} must be at most ${max}`
  return n
}

function parseNonNegative(value: string, label: string, max: number): string | number {
  if (value.trim() === "") return `${label} is required`
  const n = Number(value)
  if (!Number.isFinite(n)) return `${label} must be a number`
  if (n < 0) return `${label} must be 0 or greater`
  if (n > max) return `${label} must be at most ${max}`
  return n
}

export function TreadmillEntryForm({
  settings,
  onSubmit,
  isSubmitting,
  initial,
  submitLabel,
  today,
}: Props) {
  const maxDate = today ?? browserToday()
  const form = useForm<FormFields>({
    defaultValues: {
      speedMph: initial?.speedMph ?? "",
      inclinePct: initial?.inclinePct ?? "",
      minutes: initial?.minutes ?? "",
      date: initial?.date ?? maxDate,
      notes: initial?.notes ?? "",
    },
  })

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (raw) => {
          const speed = parsePositive(raw.speedMph, "Speed", 20)
          const incline = parseNonNegative(raw.inclinePct, "Incline", 30)
          const minutes = parsePositive(raw.minutes, "Minutes", 600)
          const date = raw.date.trim()

          let valid = true
          if (typeof speed === "string") {
            form.setError("speedMph", { message: speed })
            valid = false
          }
          if (typeof incline === "string") {
            form.setError("inclinePct", { message: incline })
            valid = false
          }
          if (typeof minutes === "string") {
            form.setError("minutes", { message: minutes })
            valid = false
          }
          if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            form.setError("date", { message: "Pick a valid date" })
            valid = false
          } else if (date > maxDate) {
            form.setError("date", { message: "Date can't be in the future" })
            valid = false
          }
          if (!valid) return

          const speedMph = speed as number
          const inclinePct = incline as number
          const minutesN = minutes as number
          const distanceMi = computeDistance(speedMph, minutesN)
          const steps = computeSteps(distanceMi, settings.strideIn)
          const calories = computeCalories(
            speedMph,
            inclinePct,
            minutesN,
            settings.weightLb,
          )
          const trimmedNotes = raw.notes.trim()

          await onSubmit({
            speedMph,
            inclinePct,
            minutes: minutesN,
            distanceMi,
            steps,
            calories,
            date,
            ...(trimmedNotes !== "" && { notes: trimmedNotes }),
          })
          form.reset()
        })}
        className="grid gap-4"
        noValidate
      >
        <FormField
          control={form.control}
          name="speedMph"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Speed (mph)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.1"
                  inputMode="decimal"
                  placeholder="3.5"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="inclinePct"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Incline (%)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.5"
                  inputMode="decimal"
                  placeholder="5"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="minutes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Minutes</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="1"
                  inputMode="numeric"
                  placeholder="45"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date</FormLabel>
              <FormControl>
                <Input type="date" max={maxDate} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (optional)</FormLabel>
              <FormControl>
                <Input type="text" placeholder="felt great" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : (submitLabel ?? "Save workout")}
        </Button>
      </form>
    </Form>
  )
}
