import { eq, sql } from "drizzle-orm"
import { db } from "./client"
import { webauthnCredential, type WebauthnCredential } from "./schema"

export type SaveCredentialInput = {
  /** Credential ID, base64url-encoded. */
  id: string
  /** COSE public key, base64url-encoded. */
  publicKey: string
  counter: number
  transports?: string[] | null
  deviceLabel?: string | null
}

export async function saveCredential(
  input: SaveCredentialInput,
): Promise<WebauthnCredential> {
  const [row] = await db
    .insert(webauthnCredential)
    .values({
      id: input.id,
      publicKey: input.publicKey,
      counter: input.counter,
      transports: input.transports ?? null,
      deviceLabel: input.deviceLabel ?? null,
    })
    .returning()
  return row
}

export async function getCredentialById(
  id: string,
): Promise<WebauthnCredential | null> {
  const rows = await db
    .select()
    .from(webauthnCredential)
    .where(eq(webauthnCredential.id, id))
    .limit(1)
  return rows[0] ?? null
}

export async function listCredentials(): Promise<WebauthnCredential[]> {
  return db.select().from(webauthnCredential)
}

export async function countCredentials(): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(webauthnCredential)
  return row?.count ?? 0
}

/** Bump the signature counter and stamp last use after a successful login. */
export async function updateCredentialCounter(
  id: string,
  counter: number,
): Promise<void> {
  await db
    .update(webauthnCredential)
    .set({ counter, lastUsedAt: new Date() })
    .where(eq(webauthnCredential.id, id))
}

export async function deleteCredential(id: string): Promise<void> {
  await db.delete(webauthnCredential).where(eq(webauthnCredential.id, id))
}
