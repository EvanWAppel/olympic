import { redirect } from "next/navigation"
import { listRecapYears } from "@/lib/recap-data"

export const dynamic = "force-dynamic"

/** `/recap` → the newest year's recap. */
export default async function RecapIndex() {
  const [latest] = await listRecapYears()
  redirect(`/recap/${latest}`)
}
