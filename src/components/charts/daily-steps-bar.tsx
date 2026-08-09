"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { eventMarkersFor } from "@/lib/world-events"
import { eventReferenceLines } from "./event-reference-lines"

export interface DailyStepsPoint {
  date: string
  treadmillSteps: number
  outdoorSteps: number
}

interface Props {
  data: DailyStepsPoint[]
  goal?: number
}

export function DailyStepsBar({ data, goal }: Props) {
  const events = eventMarkersFor(
    data.map((d) => d.date),
    "day",
  )
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="date" stroke="currentColor" fontSize={11} interval="preserveStartEnd" />
          <YAxis stroke="currentColor" fontSize={11} />
          <Tooltip
            contentStyle={{
              background: "var(--background)",
              border: "1px solid var(--border)",
              borderRadius: "0.5rem",
              fontSize: "0.75rem",
            }}
            formatter={(value, name) => [Number(value ?? 0).toLocaleString(), name]}
          />
          <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
          <Bar dataKey="treadmillSteps" name="Treadmill" stackId="a" fill="hsl(220, 90%, 56%)" />
          <Bar dataKey="outdoorSteps" name="Outdoor" stackId="a" fill="hsl(140, 65%, 50%)" />
          {eventReferenceLines(events)}
          {goal && (
            <ReferenceLine
              y={goal}
              stroke="hsl(0, 70%, 55%)"
              strokeDasharray="4 4"
              label={{ value: `Goal ${goal.toLocaleString()}`, fontSize: 10, fill: "hsl(0, 70%, 55%)" }}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
