import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

function verifyToken(token: string): { id: string; email: string } | null {
  if (!JWT_SECRET) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; email: string };
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect admin dashboard routes (not /admin/login)
  if (pathname.startsWith("/admin/dashboard")) {
    const adminToken = req.cookies.get("admin_token")?.value;
    if (!adminToken || !verifyToken(adminToken)) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/dashboard/:path*"],
};
