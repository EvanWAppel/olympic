"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { startAuthentication, startRegistration } from "@simplewebauthn/browser"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"

const JSON_HEADERS = { "content-type": "application/json" }

export function LoginPanel() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [bootstrapSecret, setBootstrapSecret] = useState("")
  const [deviceLabel, setDeviceLabel] = useState("")

  function onSuccess(message: string) {
    toast.success(message)
    router.replace("/")
    router.refresh()
  }

  async function login() {
    setBusy(true)
    try {
      const optRes = await fetch("/api/auth/login/options", {
        method: "POST",
        headers: JSON_HEADERS,
        body: "{}",
      })
      if (!optRes.ok) throw new Error("Could not start login")
      const optionsJSON = await optRes.json()

      const response = await startAuthentication({ optionsJSON })

      const verifyRes = await fetch("/api/auth/login/verify", {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({ response }),
      })
      if (!verifyRes.ok) throw new Error("Login failed")

      onSuccess("Welcome back")
    } catch (err) {
      // A user-cancelled passkey prompt also lands here.
      toast.error(err instanceof Error ? err.message : "Login failed")
    } finally {
      setBusy(false)
    }
  }

  async function register() {
    if (!bootstrapSecret) {
      toast.error("Enter the bootstrap secret")
      return
    }
    setBusy(true)
    try {
      const headers = { ...JSON_HEADERS, "x-bootstrap-secret": bootstrapSecret }
      const optRes = await fetch("/api/auth/register/options", {
        method: "POST",
        headers,
        body: "{}",
      })
      if (!optRes.ok) throw new Error("Registration not allowed")
      const optionsJSON = await optRes.json()

      const response = await startRegistration({ optionsJSON })

      const verifyRes = await fetch("/api/auth/register/verify", {
        method: "POST",
        headers,
        body: JSON.stringify({
          response,
          deviceLabel: deviceLabel || undefined,
        }),
      })
      if (!verifyRes.ok) throw new Error("Registration failed")

      onSuccess("Device registered")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Olympic</CardTitle>
        <CardDescription>Owner access</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <Button type="button" onClick={login} disabled={busy}>
          {busy ? "…" : "Log in with passkey"}
        </Button>

        {showRegister ? (
          <div className="grid gap-3 border-t pt-4">
            <div className="grid gap-2">
              <label htmlFor="bootstrap-secret" className="text-sm font-medium">
                Bootstrap secret
              </label>
              <Input
                id="bootstrap-secret"
                type="password"
                autoComplete="off"
                value={bootstrapSecret}
                onChange={(e) => setBootstrapSecret(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="device-label" className="text-sm font-medium">
                Device name (optional)
              </label>
              <Input
                id="device-label"
                placeholder="iPhone"
                value={deviceLabel}
                onChange={(e) => setDeviceLabel(e.target.value)}
              />
            </div>
            <Button type="button" onClick={register} disabled={busy}>
              {busy ? "…" : "Register"}
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="ghost"
            className="text-xs text-muted-foreground"
            onClick={() => setShowRegister(true)}
          >
            Register a device
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
