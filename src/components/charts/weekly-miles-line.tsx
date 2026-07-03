"use client"

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { WeekMiles } from "@/lib/chart-data"
import { rollingAverage } from "@/lib/chart-data"
import { eventMarkersFor } from "@/lib/world-events"
import { eventReferenceLines } from "./event-reference-lines"

interface Props {
  weeks: WeekMiles[]
  rollingWindow?: number
}

export function WeeklyMilesLine({ weeks, rollingWindow = 4 }: Props) {
  const series = weeks.map((w) => ({ x: w.weekStart, miles: w.miles }))
  const avg = rollingAverage(series, rollingWindow, "miles")
  const merged = series.map((s, i) => ({
    x: s.x,
    miles: Number(s.miles.toFixed(2)),
    avg: avg[i].avg === null ? null : Number(avg[i].avg!.toFixed(2)),
  }))
  const events = eventMarkersFor(
    weeks.map((w) => w.weekStart),
    "week",
  )

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={merged} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="x" stroke="currentColor" fontSize={11} />
          <YAxis stroke="currentColor" fontSize={11} />
          <Tooltip
            contentStyle={{
              background: "var(--background)",
              border: "1px solid var(--border)",
              borderRadius: "0.5rem",
              fontSize: "0.75rem",
            }}
          />
          <Line
            type="monotone"
            dataKey="miles"
            name="Weekly miles"
            stroke="hsl(220, 90%, 56%)"
            strokeWidth={2}
            dot={{ r: 2 }}
          />
          <Line
            type="monotone"
            dataKey="avg"
            name={`${rollingWindow}-wk avg`}
            stroke="hsl(0, 70%, 55%)"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            dot={false}
            connectNulls={false}
          />
          {eventReferenceLines(events)}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
