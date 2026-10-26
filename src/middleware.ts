import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE } from "@/lib/auth/constants";

const PUBLIC_PATHS = new Set([
  "/login",
  "/register",
  "/maintenance",
  "/api/setup/schema",
]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get(SESSION_COOKIE)?.value;
  const isPublic = PUBLIC_PATHS.has(pathname);

  if (!session && !isPublic) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(login);
  }

  if (session && isPublic) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Auth gate for pages only.
     * Static PWA files MUST stay public or iOS cannot install / run standalone
     * (sw.js, apple-touch-icon, manifest, icons).
     */
    "/((?!_next/static|_next/image|favicon.ico|apple-touch-icon.png|sw.js|icons/|manifest.webmanifest).*)",
  ],
};
