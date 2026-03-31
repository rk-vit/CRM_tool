import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const role = req.auth?.user?.role;
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // Define route groups
  const adminRoutes = ["/admin"];
  const salesRoutes = ["/dashboard", "/leads", "/calls", "/emails"];
  
  const isAdminPath = adminRoutes.some(route => pathname.startsWith(route));
  const isSalesPath = salesRoutes.some(route => pathname.startsWith(route));

  // 1. Redirect unauthenticated users to login
  if (!isLoggedIn && (isAdminPath || isSalesPath)) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // 2. Redirect authenticated users away from login page
  if (isLoggedIn && pathname === "/") {
    const target = role === "admin" ? "/admin" : "/dashboard";
    return NextResponse.redirect(new URL(target, req.url));
  }

  // 3. Admin path protection: Only "admin" role allowed
  if (isAdminPath && role !== "admin") {
    // If a sales person tries to access /admin, send them to their dashboard
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // 4. Sales path protection: Only "sales" role allowed
  if (isSalesPath && role !== "sales") {
    // If an admin tries to access /dashboard, send them to /admin
    if (role === "admin") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    // Otherwise (shouldn't happen with valid roles), send to login
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
