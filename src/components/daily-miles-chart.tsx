"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { DailyMiles } from "@/lib/aggregate-daily"

interface Props {
  data: DailyMiles[]
}

export function DailyMilesChart({ data }: Props) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="date" stroke="currentColor" fontSize={12} />
          <YAxis stroke="currentColor" fontSize={12} />
          <Tooltip
            contentStyle={{
              background: "var(--background)",
              border: "1px solid var(--border)",
              borderRadius: "0.5rem",
              fontSize: "0.875rem",
            }}
          />
          <Bar dataKey="miles" fill="hsl(220, 90%, 56%)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
