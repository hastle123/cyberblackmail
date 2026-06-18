import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, isValidAdminSessionToken } from "@/lib/forum-admin-auth";
import { RU_LOCALE_ENABLED, routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

function adminSessionOk(request: NextRequest) {
  return isValidAdminSessionToken(request.cookies.get(COOKIE_NAME)?.value);
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (pathname !== "/admin/login" && !(await adminSessionOk(request))) {
      const login = new URL("/admin/login", request.url);
      login.searchParams.set("next", pathname);
      return NextResponse.redirect(login);
    }
    return NextResponse.next();
  }

  if (!RU_LOCALE_ENABLED) {
    if (pathname === "/ru" || pathname.startsWith("/ru/")) {
      const path = pathname.replace(/^\/ru/, "") || "/";
      return NextResponse.redirect(new URL(path, request.url));
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
