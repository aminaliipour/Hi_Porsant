import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next()

  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Handle fonts with long cache
  if (pathname.startsWith('/fonts/')) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
    return response
  }

  // Cache static assets and optimized images
  if (pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|eot)$/) ||
      pathname.startsWith('/_next/static/')) {
    response.headers.set('Cache-Control', 'public, max-age=2592000, s-maxage=2592000, immutable')
    return response
  }

  const token = request.cookies.get("auth_token")?.value

  // Protected dashboard routes
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/porsant")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  // Auth routes (redirect to dashboard if already logged in)
  if (pathname === "/login") {
    if (token) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  // Root route redirection
  if (pathname === "/") {
    if (token) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    } else {
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/porsant/:path*",
    "/login",
    "/",
    "/fonts/:path*",
    "/api/:path*"
  ],
}
