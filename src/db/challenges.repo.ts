import { eq } from "drizzle-orm"
import { db } from "./client"
import { webauthnChallenge } from "./schema"

export type ChallengeType = "registration" | "authentication"

const DEFAULT_TTL_MS = 5 * 60_000 // 5 minutes

export type CreateChallengeInput = {
  challenge: string
  type: ChallengeType
  /** Time-to-live in ms (default 5 min). Negative values create an already-expired challenge. */
  ttlMs?: number
}

export async function createChallenge(
  input: CreateChallengeInput,
): Promise<void> {
  const ttl = input.ttlMs ?? DEFAULT_TTL_MS
  await db.insert(webauthnChallenge).values({
    challenge: input.challenge,
    type: input.type,
    expiresAt: new Date(Date.now() + ttl),
  })
}

/**
 * Atomically consume the pending challenge for `type`: deletes every challenge
 * of that type (single-use + cleanup of any stale ones) and returns the most
 * recent non-expired challenge string, or null if none is valid.
 */
export async function consumeChallenge(
  type: ChallengeType,
): Promise<string | null> {
  const deleted = await db
    .delete(webauthnChallenge)
    .where(eq(webauthnChallenge.type, type))
    .returning()

  const now = new Date()
  const valid = deleted
    .filter((row) => row.expiresAt > now)
    .sort((a, b) => b.expiresAt.getTime() - a.expiresAt.getTime())

  return valid[0]?.challenge ?? null
}
