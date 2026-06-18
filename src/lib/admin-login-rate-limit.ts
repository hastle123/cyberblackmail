import { getClientIp } from "@/lib/rate-limit";

const MAX_ATTEMPTS = 2;
const LOCKOUT_MS = 60 * 60 * 1000;

type Bucket = {
  failures: number;
  lockedUntil?: number;
};

const buckets = new Map<string, Bucket>();

function key(ip: string) {
  return `admin-login:${ip}`;
}

export function checkAdminLoginAllowed(request: Request): {
  allowed: boolean;
  retryAfterMs?: number;
} {
  const ip = getClientIp(request);
  const bucket = buckets.get(key(ip));
  const now = Date.now();

  if (bucket?.lockedUntil && now < bucket.lockedUntil) {
    return { allowed: false, retryAfterMs: bucket.lockedUntil - now };
  }

  if (bucket?.lockedUntil && now >= bucket.lockedUntil) {
    buckets.delete(key(ip));
  }

  return { allowed: true };
}

export function recordAdminLoginFailure(request: Request): {
  locked: boolean;
  retryAfterMs?: number;
} {
  const ip = getClientIp(request);
  const k = key(ip);
  const now = Date.now();
  const bucket = buckets.get(k) ?? { failures: 0 };

  bucket.failures += 1;

  if (bucket.failures >= MAX_ATTEMPTS) {
    bucket.lockedUntil = now + LOCKOUT_MS;
    bucket.failures = 0;
    buckets.set(k, bucket);
    return { locked: true, retryAfterMs: LOCKOUT_MS };
  }

  buckets.set(k, bucket);
  return { locked: false };
}

export function clearAdminLoginFailures(request: Request) {
  buckets.delete(key(getClientIp(request)));
}

export function formatLockoutMinutes(ms: number) {
  return Math.max(1, Math.ceil(ms / 60_000));
}
