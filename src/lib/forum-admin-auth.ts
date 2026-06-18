import { cookies } from "next/headers";

const COOKIE_NAME = "cb_admin";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function secret() {
  return process.env.NEXTAUTH_SECRET ?? "dev-insecure-secret";
}

function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

async function sign(payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function verifyAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD?.trim();
  if (!expected) return false;
  return timingSafeEqualStr(password, expected);
}

export async function createAdminSessionToken(): Promise<string> {
  const exp = Date.now() + SESSION_TTL_MS;
  const payload = `${exp}`;
  return `${payload}.${await sign(payload)}`;
}

export async function isValidAdminSessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [expStr, sig] = token.split(".");
  if (!expStr || !sig) return false;
  const expected = await sign(expStr);
  if (!timingSafeEqualStr(sig, expected)) return false;
  const exp = Number(expStr);
  return Number.isFinite(exp) && exp > Date.now();
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const jar = await cookies();
  return isValidAdminSessionToken(jar.get(COOKIE_NAME)?.value);
}

export { COOKIE_NAME, SESSION_TTL_MS };
