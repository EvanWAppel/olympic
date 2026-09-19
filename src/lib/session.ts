import { cookies } from "next/headers"
import { SignJWT, jwtVerify } from "jose"

const COOKIE_NAME = "olympic_session"
const ALG = "HS256"
const SUBJECT = "owner"
// 30-day rolling session — single-user gym app, re-auth is one Face ID tap.
const DEFAULT_MAX_AGE_SECONDS = 60 * 60 * 24 * 30

export type Session = { sub: string }

export class UnauthorizedError extends Error {
  constructor(message = "Owner session required") {
    super(message)
    this.name = "UnauthorizedError"
  }
}

function secret(): Uint8Array {
  const value = process.env.SESSION_SECRET
  if (!value) throw new Error("SESSION_SECRET is not set")
  return new TextEncoder().encode(value)
}

/** Sign an owner session JWT. `maxAgeSeconds` is exposed for testing expiry. */
export async function createSessionToken(
  maxAgeSeconds: number = DEFAULT_MAX_AGE_SECONDS,
): Promise<string> {
  const nowSec = Math.floor(Date.now() / 1000)
  return new SignJWT({})
    .setProtectedHeader({ alg: ALG })
    .setSubject(SUBJECT)
    .setIssuedAt(nowSec)
    .setExpirationTime(nowSec + maxAgeSeconds)
    .sign(secret())
}

/** Verify a token's signature + expiry. Returns the session, or null if invalid. */
export async function verifySessionToken(
  token: string,
): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: [ALG] })
    if (payload.sub !== SUBJECT) return null
    return { sub: payload.sub }
  } catch {
    return null
  }
}

/** Mint a session token and write it as an httpOnly cookie (use in route handlers). */
export async function setSessionCookie(): Promise<void> {
  const token = await createSessionToken()
  const store = await cookies()
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: DEFAULT_MAX_AGE_SECONDS,
  })
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies()
  store.delete(COOKIE_NAME)
}

/** Read + verify the current session cookie. Null when absent or invalid. */
export async function getSession(): Promise<Session | null> {
  const store = await cookies()
  const token = store.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifySessionToken(token)
}

/** Like getSession but throws UnauthorizedError when there is no valid session. */
export async function requireOwner(): Promise<Session> {
  const session = await getSession()
  if (!session) throw new UnauthorizedError()
  return session
}
