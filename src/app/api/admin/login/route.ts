import { NextRequest, NextResponse } from "next/server";
import {
  checkAdminLoginAllowed,
  clearAdminLoginFailures,
  formatLockoutMinutes,
  recordAdminLoginFailure,
} from "@/lib/admin-login-rate-limit";
import {
  COOKIE_NAME,
  SESSION_TTL_MS,
  createAdminSessionToken,
  verifyAdminPassword,
} from "@/lib/forum-admin-auth";
import { apiError, apiSuccess } from "@/lib/api";

export async function POST(request: NextRequest) {
  try {
    const lock = checkAdminLoginAllowed(request);
    if (!lock.allowed) {
      const minutes = formatLockoutMinutes(lock.retryAfterMs ?? 0);
      return apiError(`Too many attempts. Try again in ${minutes} min.`, 429);
    }

    const body = await request.json();
    const password = String(body.password ?? "");

    if (!verifyAdminPassword(password)) {
      const failure = recordAdminLoginFailure(request);
      if (failure.locked) {
        const minutes = formatLockoutMinutes(failure.retryAfterMs ?? 0);
        return apiError(`Too many attempts. Blocked for ${minutes} min.`, 429);
      }
      return apiError("Invalid password", 401);
    }

    clearAdminLoginFailures(request);

    const token = await createAdminSessionToken();
    const res = apiSuccess({ ok: true });
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: SESSION_TTL_MS / 1000,
      path: "/",
    });
    return res;
  } catch {
    return apiError("Login failed", 500);
  }
}

export async function DELETE() {
  const res = apiSuccess({ ok: true });
  res.cookies.set(COOKIE_NAME, "", { httpOnly: true, maxAge: 0, path: "/" });
  return res;
}
