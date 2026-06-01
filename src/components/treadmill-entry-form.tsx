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

export interface TreadmillEntryValues {
  speedMph: number
  inclinePct: number
  minutes: number
}

interface FormFields {
  speedMph: string
  inclinePct: string
  minutes: string
}

interface Props {
  onSubmit: (values: TreadmillEntryValues) => Promise<void> | void
  isSubmitting?: boolean
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

export function TreadmillEntryForm({ onSubmit, isSubmitting }: Props) {
  const form = useForm<FormFields>({
    defaultValues: { speedMph: "", inclinePct: "", minutes: "" },
  })

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (raw) => {
          const speed = parsePositive(raw.speedMph, "Speed", 20)
          const incline = parseNonNegative(raw.inclinePct, "Incline", 30)
          const minutes = parsePositive(raw.minutes, "Minutes", 600)

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
          if (!valid) return

          await onSubmit({
            speedMph: speed as number,
            inclinePct: incline as number,
            minutes: minutes as number,
          })
          form.reset()
        })}
        className="grid gap-4"
        noValidate
      >
        <FormField
          control={form.control}
          name="speedMph"
          rules={{ required: "Speed is required" }}
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
          rules={{ required: "Incline is required" }}
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
          rules={{ required: "Minutes is required" }}
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
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Save workout"}
        </Button>
      </form>
    </Form>
  )
}
