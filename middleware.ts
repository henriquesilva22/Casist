import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('lifeos_token')?.value
  const user = request.cookies.get('lifeos_user')?.value
  const path = request.nextUrl.pathname
  const isAuthenticated = Boolean(token || user)
  const publicPaths = path.startsWith('/login') || path.startsWith('/_next') || path.startsWith('/api') || path === '/favicon.ico'

  if (path.startsWith('/login') && isAuthenticated) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  if (publicPaths) return NextResponse.next()
  if ((path === '/' || path.startsWith('/dashboard')) && !isAuthenticated) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = { matcher: ['/', '/dashboard/:path*', '/login'] }
