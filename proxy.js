import {  NextResponse  } from "next/server"
import {  jwtVerify  } from "jose"

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key-change-this")

const protectedRoutes = ["/admin/dashboard", "/organiser/dashboard", "/attendee/dashboard"]
const authRoutes = ["/auth/login", "/auth/register", "/auth/register-attendee", "/auth/register-organizer"]

export async function proxy(request) {
  const pathname = request.nextUrl.pathname

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

  const token = request.cookies.get("session")?.value

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && token) {
    try {
      const verified = await jwtVerify(token, secret)
      const role = (verified.payload ).role

      // Redirect to appropriate dashboard
      if (role === "admin") {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url))
      } else if (role === "organiser") {
        return NextResponse.redirect(new URL("/organiser/dashboard", request.url))
      } else {
        return NextResponse.redirect(new URL("/attendee/dashboard", request.url))
      }
    } catch (error) {
      // Invalid token, allow access to auth pages
      return NextResponse.next()
    }
  }

  // Protect routes that require authentication
  if (isProtectedRoute) {
    if (!token) {
      return NextResponse.redirect(new URL("/auth/login", request.url))
    }

    try {
      const verified = await jwtVerify(token, secret)
      const role = (verified.payload ).role

      // Role-based access control
      if (pathname.startsWith("/admin") && role !== "admin") {
        return NextResponse.redirect(new URL("/", request.url))
      }
      if (pathname.startsWith("/organiser") && role !== "organiser" && role !== "admin") {
        return NextResponse.redirect(new URL("/", request.url))
      }
      if (pathname.startsWith("/attendee") && role !== "attendee" && role !== "admin") {
        return NextResponse.redirect(new URL("/", request.url))
      }

      return NextResponse.next()
    } catch (error) {
      console.error("[v0] Proxy auth error:", error)
      return NextResponse.redirect(new URL("/auth/login", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/organiser/:path*", "/attendee/:path*", "/auth/:path*"],
}

