// ─────────────────────────────────────────────────────────────────────────────
// MEDSYNC — Client-side encryption for sensitive patient fields
// Uses Web Crypto API (AES-GCM 256-bit) — built into every modern browser.
// Key is generated per session and never sent to the server.
// GDPR Article 32 compliant — Supabase stores only ciphertext.
// ─────────────────────────────────────────────────────────────────────────────

let _sessionKey: CryptoKey | null = null;

// Generate or retrieve the session encryption key
async function getSessionKey(): Promise<CryptoKey> {
  if (_sessionKey) return _sessionKey;

  _sessionKey = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    false, // not extractable — key never leaves memory
    ["encrypt", "decrypt"]
  );

  return _sessionKey;
}

// Encrypt a string value — returns base64 encoded ciphertext
export async function encryptField(value: string | null | undefined): Promise<string | null> {
  if (!value) return null;

  const key = await getSessionKey();
  const iv  = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV
  const encoded = new TextEncoder().encode(value);

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded
  );

  // Combine IV + ciphertext and encode as base64
  const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.byteLength);

  return btoa(String.fromCharCode(...combined));
}

// Decrypt a base64 encoded ciphertext — returns original string
export async function decryptField(encoded: string | null | undefined): Promise<string | null> {
  if (!encoded) return null;

  const key = await getSessionKey();
  const combined = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));

  const iv         = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
}

// Encrypt multiple fields at once
export async function encryptFields<T extends Record<string, string | null | undefined>>(
  fields: T
): Promise<Record<keyof T, string | null>> {
  const result = {} as Record<keyof T, string | null>;
  for (const key of Object.keys(fields) as (keyof T)[]) {
    result[key] = await encryptField(fields[key] as string | null);
  }
  return result;
}