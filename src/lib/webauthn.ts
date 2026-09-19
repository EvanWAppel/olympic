import { timingSafeEqual } from "node:crypto"
import { getSession } from "./session"
import { countCredentials } from "@/db/credentials.repo"

export const RP_NAME = "Olympic"

/** A stable user handle — there is only ever one user (the owner). */
export const OWNER_USER_NAME = "owner"

/**
 * Relying-party config. Derived from the request's Origin header so dev
 * (localhost) and prod work with no config; override with RP_ORIGIN / RP_ID.
 */
export function getRpConfig(req: Request): { rpID: string; origin: string } {
  const origin =
    process.env.RP_ORIGIN ?? req.headers.get("origin") ?? "http://localhost:3000"
  const rpID = process.env.RP_ID ?? new URL(origin).hostname
  return { rpID, origin }
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  return timingSafeEqual(ab, bb)
}

/** Pull the bootstrap secret from the header or the JSON body. */
export function extractBootstrapSecret(
  req: Request,
  body?: unknown,
): string | null {
  const header = req.headers.get("x-bootstrap-secret")
  if (header) return header
  if (body && typeof body === "object" && "bootstrapSecret" in body) {
    const v = (body as Record<string, unknown>).bootstrapSecret
    if (typeof v === "string") return v
  }
  return null
}

/**
 * Registration is allowed only when BOTH hold (PRD §7.2):
 *   1. a valid BOOTSTRAP_REGISTRATION_SECRET is supplied, AND
 *   2. there are zero credentials yet (first device) OR a valid owner session
 *      exists (adding a subsequent device).
 */
export async function isRegistrationAllowed(
  secret: string | null,
): Promise<boolean> {
  const expected = process.env.BOOTSTRAP_REGISTRATION_SECRET
  if (!expected || !secret || !safeEqual(secret, expected)) return false
  const session = await getSession()
  if (session) return true
  return (await countCredentials()) === 0
}
