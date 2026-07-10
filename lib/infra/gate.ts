export const GATE_COOKIE_NAME = "gate_session";
export const GATE_COOKIE_TTL_SECONDS = 60 * 60 * 24 * 30;
export const GATE_FAILURE_DELAY_MS = 700;

export type GateVerifyResult =
  { ok: true } | { ok: false; reason: "malformed" | "bad-signature" | "expired" };

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(value.length + ((4 - (value.length % 4)) % 4), "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function hmacSign(secret: string, payload: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return new Uint8Array(signature);
}

export function timingSafeEqual(a: string, b: string): boolean {
  const aBytes = new TextEncoder().encode(a);
  const bBytes = new TextEncoder().encode(b);
  if (aBytes.length !== bBytes.length) return false;

  let diff = 0;
  for (let i = 0; i < aBytes.length; i++) diff |= aBytes[i] ^ bBytes[i];
  return diff === 0;
}

export async function createGateToken(
  secret: string,
  now: Date,
  ttlSeconds: number,
): Promise<string> {
  const exp = Math.floor(now.getTime() / 1000) + ttlSeconds;
  const payload = toBase64Url(new TextEncoder().encode(JSON.stringify({ exp })));
  const signature = toBase64Url(await hmacSign(secret, payload));
  return `${payload}.${signature}`;
}

export async function verifyGateToken(
  token: string,
  secret: string,
  now: Date,
): Promise<GateVerifyResult> {
  const parts = token.split(".");
  if (parts.length !== 2) return { ok: false, reason: "malformed" };
  const [payload, signature] = parts;

  let exp: number;
  try {
    const decoded: unknown = JSON.parse(new TextDecoder().decode(fromBase64Url(payload)));
    if (
      typeof decoded !== "object" ||
      decoded === null ||
      typeof (decoded as { exp?: unknown }).exp !== "number"
    ) {
      return { ok: false, reason: "malformed" };
    }
    exp = (decoded as { exp: number }).exp;
  } catch {
    return { ok: false, reason: "malformed" };
  }

  const expectedSignature = toBase64Url(await hmacSign(secret, payload));
  if (!timingSafeEqual(signature, expectedSignature)) {
    return { ok: false, reason: "bad-signature" };
  }

  if (Math.floor(now.getTime() / 1000) >= exp) {
    return { ok: false, reason: "expired" };
  }

  return { ok: true };
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
