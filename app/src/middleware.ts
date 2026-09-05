import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

// lib/auth.ts ile AYNI tut: middleware edge-runtime'de calistigi icin
// oradan db/pg import EDEMEZ; bayrak iki tarafta da elle yazilir.
const DEMO_MODE = (process.env.DEMO_MODE ?? "on") !== "off";

const PROTECTED = [
  "/dashboard",
  "/lessons",
  "/review",
  "/ai-teacher",
  "/games",
  "/premium",
  "/dictionary",
  "/leaderboard",
  "/friends",
  "/achievements",
  "/profile",
  "/settings",
  "/stories",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (DEMO_MODE) {
    // Demo modunda login yok: giris/kayit/pazarlama sayfasi yerine
    // dogrudan uygulamaya yonlendir, korumali sayfaları ac.
    if (pathname === "/" || pathname === "/login" || pathname === "/register") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  const needsAuth = PROTECTED.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (!needsAuth) return NextResponse.next();

  const token = req.cookies.get("parla-token")?.value;
  let valid = false;
  if (token) {
    try {
      await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET || "parla-fallback-secret"));
      valid = true;
    } catch {
      valid = false;
    }
  }

  if (!valid) {
    const res = NextResponse.redirect(new URL("/login", req.url));
    if (token) res.cookies.delete("parla-token");
    return res;
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|icons|.*\\..*).*)"],
};
