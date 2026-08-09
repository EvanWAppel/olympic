import { NextResponse } from "next/server"
import { verifyRegistrationResponse } from "@simplewebauthn/server"
import {
  getRpConfig,
  extractBootstrapSecret,
  isRegistrationAllowed,
} from "@/lib/webauthn"
import { consumeChallenge } from "@/db/challenges.repo"
import { saveCredential } from "@/db/credentials.repo"
import { setSessionCookie } from "@/lib/session"

export const runtime = "nodejs"

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { response?: unknown; deviceLabel?: unknown }
    | null
  const secret = extractBootstrapSecret(req, body)
  if (!(await isRegistrationAllowed(secret))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const response = body?.response
  if (!response || typeof response !== "object") {
    return NextResponse.json({ error: "missing_response" }, { status: 400 })
  }

  const expectedChallenge = await consumeChallenge("registration")
  if (!expectedChallenge) {
    return NextResponse.json({ error: "challenge_expired" }, { status: 400 })
  }

  const { rpID, origin } = getRpConfig(req)

  let verification
  try {
    verification = await verifyRegistrationResponse({
      // Trust the JSON shape; verifyRegistrationResponse does the real checks.
      response: response as Parameters<
        typeof verifyRegistrationResponse
      >[0]["response"],
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: false,
    })
  } catch {
    return NextResponse.json({ error: "verification_failed" }, { status: 400 })
  }

  if (!verification.verified || !verification.registrationInfo) {
    return NextResponse.json({ error: "not_verified" }, { status: 400 })
  }

  const { credential } = verification.registrationInfo
  await saveCredential({
    id: credential.id,
    publicKey: Buffer.from(credential.publicKey).toString("base64url"),
    counter: credential.counter,
    transports: credential.transports ?? null,
    deviceLabel:
      typeof body?.deviceLabel === "string" ? body.deviceLabel : null,
  })

  // The device that registers is logged in immediately.
  await setSessionCookie()

  return NextResponse.json({ verified: true })
}
