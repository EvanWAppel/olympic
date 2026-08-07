import { NextResponse } from "next/server"
import {
  verifyAuthenticationResponse,
  type AuthenticatorTransportFuture,
} from "@simplewebauthn/server"
import { getRpConfig } from "@/lib/webauthn"
import { consumeChallenge } from "@/db/challenges.repo"
import {
  getCredentialById,
  updateCredentialCounter,
} from "@/db/credentials.repo"
import { setSessionCookie } from "@/lib/session"

export const runtime = "nodejs"

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { response?: { id?: string } & Record<string, unknown> }
    | null

  const response = body?.response
  if (!response || typeof response !== "object" || typeof response.id !== "string") {
    return NextResponse.json({ error: "missing_response" }, { status: 400 })
  }

  const expectedChallenge = await consumeChallenge("authentication")
  if (!expectedChallenge) {
    return NextResponse.json({ error: "challenge_expired" }, { status: 400 })
  }

  const stored = await getCredentialById(response.id)
  if (!stored) {
    return NextResponse.json({ error: "unknown_credential" }, { status: 401 })
  }

  const { rpID, origin } = getRpConfig(req)

  let verification
  try {
    verification = await verifyAuthenticationResponse({
      response: response as unknown as Parameters<
        typeof verifyAuthenticationResponse
      >[0]["response"],
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: stored.id,
        publicKey: new Uint8Array(Buffer.from(stored.publicKey, "base64url")),
        counter: stored.counter,
        transports: (stored.transports ?? undefined) as
          | AuthenticatorTransportFuture[]
          | undefined,
      },
      requireUserVerification: false,
    })
  } catch {
    return NextResponse.json({ error: "verification_failed" }, { status: 400 })
  }

  if (!verification.verified) {
    return NextResponse.json({ error: "not_verified" }, { status: 400 })
  }

  // Persist the new counter so a cloned authenticator (replayed counter) is caught next time.
  await updateCredentialCounter(stored.id, verification.authenticationInfo.newCounter)
  await setSessionCookie()

  return NextResponse.json({ verified: true })
}
