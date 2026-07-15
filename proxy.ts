import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse, type NextRequest } from "next/server";

const { auth } = NextAuth(authConfig);

function getRequestId(request: NextRequest) {
  return request.headers.get("x-request-id") ?? crypto.randomUUID();
}

export default auth((req) => {
  const requestId = getRequestId(req);
  const withRequestId = (response: NextResponse) => {
    response.headers.set("x-request-id", requestId);
    return response;
  };

  if (req.nextUrl.pathname.startsWith("/api")) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-request-id", requestId);
    return withRequestId(
      NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    );
  }

  const role = req.auth?.user?.role;
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  const adminRoutes = ["/admin"];
  const salesRoutes = ["/dashboard", "/leads", "/calls", "/emails"];

  const isAdminPath = adminRoutes.some((route) => pathname.startsWith(route));
  const isSalesPath = salesRoutes.some((route) => pathname.startsWith(route));

  if (!isLoggedIn && (isAdminPath || isSalesPath)) {
    return withRequestId(NextResponse.redirect(new URL("/", req.url)));
  }

  if (isLoggedIn && pathname === "/") {
    const target = role === "admin" ? "/admin" : "/dashboard";
    return withRequestId(NextResponse.redirect(new URL(target, req.url)));
  }

  if (isAdminPath && role !== "admin") {
    return withRequestId(NextResponse.redirect(new URL("/dashboard", req.url)));
  }

  if (isSalesPath && role !== "sales") {
    if (role === "admin") {
      return withRequestId(NextResponse.redirect(new URL("/admin", req.url)));
    }
    return withRequestId(NextResponse.redirect(new URL("/", req.url)));
  }

  return withRequestId(NextResponse.next());
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
