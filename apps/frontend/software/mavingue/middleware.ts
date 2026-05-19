// apps/frontend/software/mavingue/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function c(req: NextRequest, name: string) {
  return req.cookies.get(name)?.value ?? null;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Rotas públicas
  if (pathname === "/auth/login" || pathname === "/forbidden") {
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin") || pathname.startsWith("/staff") || pathname.startsWith("/cliente")) {
    const token = c(req, "token");
    const role = c(req, "role");

    // Sem token --Vai logar ...
    if (!token || !role) {
      const response = NextResponse.redirect(new URL("/auth/login", req.url));
      response.cookies.delete("token");
      response.cookies.delete("role");
      return response;
    }

    // Verifica roles
    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/forbidden", req.url));
    }

    if (pathname.startsWith("/staff") && !(role === "ADMIN" || role === "FUNCIONARIO" || role === "STAFF")) {
      return NextResponse.redirect(new URL("/forbidden", req.url));
    }

    if (pathname.startsWith("/cliente") && role !== "CLIENTE") {
      return NextResponse.redirect(new URL("/forbidden", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/staff/:path*", "/cliente/:path*", "/forbidden"],
};