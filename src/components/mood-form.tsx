"use client"

import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

export interface MoodValues {
  score: number
  comment?: string
}

interface FormFields {
  score: number | null
  comment: string
}

interface Props {
  onSubmit: (values: MoodValues) => Promise<void> | void
  isSubmitting?: boolean
  submitLabel?: string
}

const SCORES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

export function MoodForm({ onSubmit, isSubmitting, submitLabel }: Props) {
  const form = useForm<FormFields>({
    defaultValues: { score: null, comment: "" },
  })

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (raw) => {
          if (raw.score === null) {
            form.setError("score", { message: "Pick a number from 1 to 10" })
            return
          }
          const trimmedComment = raw.comment.trim()
          await onSubmit({
            score: raw.score,
            ...(trimmedComment !== "" && { comment: trimmedComment }),
          })
          form.reset()
        })}
        className="grid gap-4"
        noValidate
      >
        <FormField
          control={form.control}
          name="score"
          render={({ field }) => (
            <FormItem>
              <FormLabel>How are you feeling? (1–10)</FormLabel>
              <FormControl>
                <div
                  role="radiogroup"
                  aria-label="How are you feeling? (1 to 10)"
                  className="flex flex-wrap gap-2"
                >
                  {SCORES.map((n) => (
                    <Button
                      key={n}
                      type="button"
                      variant={field.value === n ? "default" : "outline"}
                      role="radio"
                      aria-checked={field.value === n}
                      aria-label={String(n)}
                      className={cn("h-10 w-10 p-0")}
                      onClick={() => {
                        field.onChange(n)
                        form.clearErrors("score")
                      }}
                    >
                      {n}
                    </Button>
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="comment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Comment (optional)</FormLabel>
              <FormControl>
                <Input type="text" placeholder="anything on your mind?" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : (submitLabel ?? "Save check-in")}
        </Button>
      </form>
    </Form>
  )
}
