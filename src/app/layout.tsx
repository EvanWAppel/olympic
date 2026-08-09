import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import { PwaSetup } from "@/components/pwa-setup"
import { SiteHeader } from "@/components/site-header"
import { getSession } from "@/lib/session"
import "./globals.css"

// Interim domain while DNS for olympic.evanappel.me propagates. Override with
// NEXT_PUBLIC_SITE_URL once the permanent domain's cert is verified.
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://olympic-lime-six.vercel.app"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Olympic",
  description: "Personal treadmill + walking tracker",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "Olympic",
    statusBarStyle: "default",
  },
}

export const viewport: Viewport = {
  themeColor: "#2563eb",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Owner mode drives write affordances (Settings link, edit/delete). The real
  // security is the server-side requireOwner() guard on every write route; this
  // just decides what chrome to show.
  const ownerMode = (await getSession()) !== null

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col overflow-x-hidden bg-background text-foreground">
        <SiteHeader ownerMode={ownerMode} />
        {children}
        <Toaster richColors position="top-center" />
        <PwaSetup />
      </body>
    </html>
  )
}
