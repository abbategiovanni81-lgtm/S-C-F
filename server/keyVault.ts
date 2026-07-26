/**
 * BYOK key vault.
 *
 * User-supplied provider API keys are encrypted at rest with AES-256-GCM
 * under KEY_ENCRYPTION_MASTER. Stored format: enc:v1:<iv>:<tag>:<ciphertext>
 * (base64 fields). Legacy plaintext rows still decrypt as-is and are
 * re-encrypted the next time the user saves keys.
 *
 * Rules (PLAN.md 4.1b):
 * - Keys are WRITE-ONLY from the client; reads expose has-flags/last-4 only.
 * - The server decrypts per request, uses the key, and discards it.
 * - Production refuses to boot key writes without KEY_ENCRYPTION_MASTER.
 */
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { userApiKeys } from "@shared/schema";

const PREFIX = "enc:v1:";

function masterKey(): Buffer | null {
  const raw = process.env.KEY_ENCRYPTION_MASTER;
  if (!raw) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("KEY_ENCRYPTION_MASTER must be set in production");
    }
    return null; // dev fallback: plaintext storage, loudly
  }
  return crypto.createHash("sha256").update(raw).digest();
}

export function encryptKey(plain: string): string {
  const key = masterKey();
  if (!key) {
    console.warn("[keyVault] KEY_ENCRYPTION_MASTER unset - storing key in plaintext (dev only)");
    return plain;
  }
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return PREFIX + [iv, tag, ct].map((b) => b.toString("base64")).join(":");
}

export function decryptKey(stored: string | null | undefined): string | null {
  if (!stored) return null;
  if (!stored.startsWith(PREFIX)) return stored; // legacy plaintext
  const key = masterKey();
  if (!key) {
    throw new Error("Encrypted key present but KEY_ENCRYPTION_MASTER is unset");
  }
  const [ivB64, tagB64, ctB64] = stored.slice(PREFIX.length).split(":");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(ctB64, "base64")), decipher.final()]).toString("utf8");
}

/** Last-4 display form; never expose more of a stored key. */
export function maskKey(stored: string | null | undefined): string | null {
  if (!stored) return null;
  try {
    const plain = decryptKey(stored);
    if (!plain) return null;
    return `...${plain.slice(-4)}`;
  } catch {
    return "...????";
  }
}

export type ProviderName =
  | "openai" | "anthropic" | "elevenlabs" | "a2e" | "fal" | "pexels"
  | "steveai" | "zernio" | "kie" | "openrouter" | "gemini" | "apify";

/** Provider name -> user_api_keys column. Zernio lives in the legacy late_key column. */
export const PROVIDER_COLUMNS: Record<ProviderName, keyof typeof userApiKeys.$inferSelect> = {
  openai: "openaiKey",
  anthropic: "anthropicKey",
  elevenlabs: "elevenlabsKey",
  a2e: "a2eKey",
  fal: "falKey",
  pexels: "pexelsKey",
  steveai: "steveaiKey",
  zernio: "lateKey",
  kie: "kieKey",
  openrouter: "openrouterKey",
  gemini: "geminiKey",
  apify: "apifyKey",
} as const;

export interface DecryptedKeys {
  openai: string | null;
  anthropic: string | null;
  elevenlabs: string | null;
  a2e: string | null;
  fal: string | null;
  pexels: string | null;
  steveai: string | null;
  zernio: string | null;
  kie: string | null;
  openrouter: string | null;
  gemini: string | null;
  apify: string | null;
}

/** Load and decrypt all of a user's provider keys. */
export async function getUserKeys(userId: string): Promise<DecryptedKeys> {
  const [row] = await db.select().from(userApiKeys).where(eq(userApiKeys.userId, userId));
  const out = {} as DecryptedKeys;
  for (const [provider, column] of Object.entries(PROVIDER_COLUMNS)) {
    out[provider as ProviderName] = row ? decryptKey((row as any)[column]) : null;
  }
  return out;
}

/** Load one provider key or throw a clean, user-actionable error. */
export async function requireUserKey(userId: string, provider: ProviderName): Promise<string> {
  const keys = await getUserKeys(userId);
  const key = keys[provider];
  if (!key) {
    const err: any = new Error(`No ${provider} API key configured. Add your key in Settings.`);
    err.status = 402;
    err.provider = provider;
    throw err;
  }
  return key;
}
