import { NextResponse } from "next/server"
import {
  generateAuthenticationOptions,
  type AuthenticatorTransportFuture,
} from "@simplewebauthn/server"
import { getRpConfig } from "@/lib/webauthn"
import { createChallenge } from "@/db/challenges.repo"
import { listCredentials } from "@/db/credentials.repo"

export const runtime = "nodejs"

export async function POST(req: Request) {
  const { rpID } = getRpConfig(req)
  const credentials = await listCredentials()

  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials: credentials.map((c) => ({
      id: c.id,
      transports: (c.transports ?? undefined) as
        | AuthenticatorTransportFuture[]
        | undefined,
    })),
    userVerification: "preferred",
  })

  await createChallenge({ challenge: options.challenge, type: "authentication" })

  return NextResponse.json(options)
}
