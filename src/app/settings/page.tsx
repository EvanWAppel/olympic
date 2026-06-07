import Link from "next/link"
import { getSettings } from "@/db/settings.repo"
import { SettingsCard } from "@/components/settings-card"
import { HealthImportCard } from "@/components/health-import-card"

export const dynamic = "force-dynamic"

export default async function SettingsPage() {
  const s = await getSettings()

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12 flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">Personal stats & goals</p>
        </div>
        <Link href="/" className="text-sm underline-offset-4 hover:underline">
          ← Dashboard
        </Link>
      </header>

      <SettingsCard
        initial={{
          weightLb: Number(s.weightLb),
          strideIn: Number(s.strideIn),
          dailyStepGoal: s.dailyStepGoal,
          weeklyMilesGoal: Number(s.weeklyMilesGoal),
          timezone: s.timezone,
        }}
      />

      <HealthImportCard />

      {/* health ingest card goes here — added in Group D integration */}
    </main>
  )
}
