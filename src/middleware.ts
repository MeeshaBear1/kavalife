import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "kl_admin_session";

function getSecret(): Uint8Array {
  const s = process.env.SESSION_SECRET || "dev_change_me_session_secret_min_32_chars_long_please";
  return new TextEncoder().encode(s);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // The login page must stay reachable without a session.
  if (pathname === "/admin/login") return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    try {
      await jwtVerify(token, getSecret());
      return NextResponse.next();
    } catch {
      /* fall through to redirect */
    }
  }

  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
