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
import { eventMarkersFor } from "@/lib/world-events"
import { eventReferenceLines } from "./event-reference-lines"

export interface PaceInclinePoint {
  weekStart: string
  avgSpeedMph: number | null
  avgInclinePct: number | null
}

interface Props {
  data: PaceInclinePoint[]
  metric: "speed" | "incline"
}

export function PaceInclineTrend({ data, metric }: Props) {
  const key = metric === "speed" ? "avgSpeedMph" : "avgInclinePct"
  const label = metric === "speed" ? "Avg speed (mph)" : "Avg incline (%)"
  const color = metric === "speed" ? "#cf4b2c" : "#777d69"
  const events = eventMarkersFor(
    data.map((d) => d.weekStart),
    "week",
  )

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="weekStart" tickFormatter={(value: string) => value.slice(5).replace("-", "/")} stroke="#838579" tickLine={false} axisLine={false} fontSize={11} />
          <YAxis stroke="#838579" tickLine={false} axisLine={false} fontSize={11} domain={["auto", "auto"]} />
          <Tooltip
            formatter={(value) => [Number(value ?? 0).toFixed(2), label]}
            contentStyle={{
              background: "var(--background)",
              border: "1px solid var(--border)",
              borderRadius: "0.5rem",
              fontSize: "0.75rem",
            }}
          />
          <Line
            type="monotone"
            dataKey={key}
            name={label}
            stroke={color}
            strokeWidth={2}
            dot={{ r: 2 }}
            connectNulls={false}
          />
          {eventReferenceLines(events)}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
