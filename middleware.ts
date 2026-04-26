import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // اگر درخواست برای فونت‌ها است، headers مناسب را اضافه کن
  if (request.nextUrl.pathname.startsWith('/fonts/')) {
    const response = NextResponse.next()
    
    // Headers برای بهبود cache و CORS
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
    
    return response
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/fonts/:path*',
  ],
}
