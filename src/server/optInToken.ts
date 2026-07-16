// Double opt-in tokens. The signed payload carries the address and an expiry,
// so a pending signup needs no storage: nothing is written to Resend until the
// link in the confirmation email is clicked.

const TTL_MS = 48 * 60 * 60 * 1000;

function b64urlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(value: string): Uint8Array | null {
  const padded = value
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");
  try {
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

// Compares in constant time so a wrong signature cannot be tuned byte by byte.
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function sign(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return b64urlEncode(new Uint8Array(signature));
}

export async function mintOptInToken(
  email: string,
  secret: string,
  now = Date.now(),
): Promise<string> {
  const payload = b64urlEncode(
    new TextEncoder().encode(JSON.stringify({ e: email, x: now + TTL_MS })),
  );
  return `${payload}.${await sign(payload, secret)}`;
}

export type OptInResult =
  { ok: true; email: string } | { ok: false; reason: "invalid" | "expired" };

export async function verifyOptInToken(
  token: string,
  secret: string,
  now = Date.now(),
): Promise<OptInResult> {
  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return { ok: false, reason: "invalid" };
  const [payload, signature] = parts;

  if (!timingSafeEqual(signature, await sign(payload, secret)))
    return { ok: false, reason: "invalid" };

  const raw = b64urlDecode(payload);
  if (!raw) return { ok: false, reason: "invalid" };

  let parsed: unknown;
  try {
    parsed = JSON.parse(new TextDecoder().decode(raw));
  } catch {
    return { ok: false, reason: "invalid" };
  }
  if (!parsed || typeof parsed !== "object") return { ok: false, reason: "invalid" };

  const { e: email, x: expiry } = parsed as { e?: unknown; x?: unknown };
  if (
    typeof email !== "string" ||
    !email ||
    typeof expiry !== "number" ||
    !Number.isFinite(expiry)
  ) {
    return { ok: false, reason: "invalid" };
  }
  if (now > expiry) return { ok: false, reason: "expired" };

  return { ok: true, email };
}
