import type { Metadata } from "next"
import { ChangelogView } from "@/components/changelog-view"
import { MILESTONES } from "@/lib/changelog"

export const metadata: Metadata = {
  title: "Changelog — Olympic",
  description: "Shipped milestones for Olympic, from the first vertical slice to today.",
}

export default function ChangelogPage() {
  return <ChangelogView milestones={MILESTONES} />
}
