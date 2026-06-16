import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function ExportCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Export data</CardTitle>
        <CardDescription>
          Download all workouts and daily metrics as a zip of CSV files.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <a
          href="/api/export"
          download
          className={buttonVariants({ variant: "outline" })}
        >
          Export CSV
        </a>
      </CardContent>
    </Card>
  )
}
