import { NextResponse } from "next/server"
import {
  generateRegistrationOptions,
  type AuthenticatorTransportFuture,
} from "@simplewebauthn/server"
import {
  RP_NAME,
  OWNER_USER_NAME,
  getRpConfig,
  extractBootstrapSecret,
  isRegistrationAllowed,
} from "@/lib/webauthn"
import { createChallenge } from "@/db/challenges.repo"
import { listCredentials } from "@/db/credentials.repo"

export const runtime = "nodejs"

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const secret = extractBootstrapSecret(req, body)
  if (!(await isRegistrationAllowed(secret))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const { rpID } = getRpConfig(req)
  const existing = await listCredentials()

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID,
    userID: new TextEncoder().encode(OWNER_USER_NAME),
    userName: OWNER_USER_NAME,
    attestationType: "none",
    // Don't let the same authenticator register twice.
    excludeCredentials: existing.map((c) => ({
      id: c.id,
      transports: (c.transports ?? undefined) as
        | AuthenticatorTransportFuture[]
        | undefined,
    })),
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
  })

  await createChallenge({ challenge: options.challenge, type: "registration" })

  return NextResponse.json(options)
}
