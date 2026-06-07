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

export interface SettingsValues {
  weightLb: number
  strideIn: number
  dailyStepGoal: number
  weeklyMilesGoal: number
  timezone: string
}

interface FormFields {
  weightLb: string
  strideIn: string
  dailyStepGoal: string
  weeklyMilesGoal: string
  timezone: string
}

interface Props {
  initial: SettingsValues
  onSubmit: (values: SettingsValues) => Promise<void> | void
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

export function SettingsForm({ initial, onSubmit, isSubmitting }: Props) {
  const form = useForm<FormFields>({
    defaultValues: {
      weightLb: String(initial.weightLb),
      strideIn: String(initial.strideIn),
      dailyStepGoal: String(initial.dailyStepGoal),
      weeklyMilesGoal: String(initial.weeklyMilesGoal),
      timezone: initial.timezone,
    },
  })

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (raw) => {
          const weight = parsePositive(raw.weightLb, "Weight", 1000)
          const stride = parsePositive(raw.strideIn, "Stride", 100)
          const stepGoal = parsePositive(raw.dailyStepGoal, "Daily step goal", 1_000_000)
          const milesGoal = parsePositive(raw.weeklyMilesGoal, "Weekly miles goal", 1000)
          const tz = raw.timezone.trim()

          let valid = true
          if (typeof weight === "string") {
            form.setError("weightLb", { message: weight })
            valid = false
          }
          if (typeof stride === "string") {
            form.setError("strideIn", { message: stride })
            valid = false
          }
          if (typeof stepGoal === "string") {
            form.setError("dailyStepGoal", { message: stepGoal })
            valid = false
          }
          if (typeof milesGoal === "string") {
            form.setError("weeklyMilesGoal", { message: milesGoal })
            valid = false
          }
          if (tz === "") {
            form.setError("timezone", { message: "Timezone is required" })
            valid = false
          }
          if (!valid) return

          await onSubmit({
            weightLb: weight as number,
            strideIn: stride as number,
            dailyStepGoal: Math.round(stepGoal as number),
            weeklyMilesGoal: milesGoal as number,
            timezone: tz,
          })
        })}
        className="grid gap-4"
        noValidate
      >
        <FormField
          control={form.control}
          name="weightLb"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Weight (lb)</FormLabel>
              <FormControl>
                <Input type="number" step="0.1" inputMode="decimal" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="strideIn"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Stride length (in)</FormLabel>
              <FormControl>
                <Input type="number" step="0.1" inputMode="decimal" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="dailyStepGoal"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Daily step goal</FormLabel>
              <FormControl>
                <Input type="number" step="100" inputMode="numeric" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="weeklyMilesGoal"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Weekly miles goal</FormLabel>
              <FormControl>
                <Input type="number" step="0.5" inputMode="decimal" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="timezone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Timezone</FormLabel>
              <FormControl>
                <Input type="text" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Save settings"}
        </Button>
      </form>
    </Form>
  )
}
