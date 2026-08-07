import type { Metadata } from "next"
import { LoginPanel } from "@/components/login-panel"

// Unadvertised owner-access page — keep it out of search indexes.
export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
}

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <LoginPanel />
    </main>
  )
}
