"use client"

import { useEffect } from "react"

/**
 * Registers the service worker once on mount. Production-only — in dev the SW
 * cache fights Next's HMR. Renders nothing.
 */
export function PwaSetup() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return
    if (!("serviceWorker" in navigator)) return
    const onLoad = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Registration failures are non-fatal; the app works without offline caching.
      })
    }
    window.addEventListener("load", onLoad)
    return () => window.removeEventListener("load", onLoad)
  }, [])

  return null
}
