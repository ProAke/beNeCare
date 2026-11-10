import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // อนุญาตให้เข้าถึงหน้าติดตั้ง, ล็อกอิน, และ static assets ได้โดยไม่ต้องล็อกอิน
  const publicPaths = [
    "/installer",
    "/login",
    "/api",
    "/_next",
    "/favicon.ico",
  ];

  const isPublic = publicPaths.some((p) => pathname.startsWith(p));

  if (isPublic) {
    return NextResponse.next();
  }

  // ตรวจสอบ session cookie
  const sessionCookie = req.cookies.get("benecare_session");

  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // ตรวจสอบว่าติดตั้งระบบแล้วหรือยัง
  const envCheck = pathname.startsWith("/api/installer/status");
  if (!envCheck && !process.env.DATABASE_URL) {
    return NextResponse.redirect(new URL("/installer", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
