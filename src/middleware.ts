import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE_NAME = 'votesync_session';

export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const { pathname } = request.nextUrl;

  let session: { isAdmin?: boolean; voterId?: string; expires?: number } | null = null;
  if (sessionCookie) {
    try {
      session = JSON.parse(sessionCookie);
      if (session?.expires && session.expires < Date.now()) {
        session = null;
      }
    } catch {
      session = null;
    }
  }
  
  const isLoginPage = pathname === '/';

  // If a voter has a session and is on the login page, redirect to their dashboard.
  if (session && session.voterId && !session.isAdmin && isLoginPage) {
    const url = new URL('/vote', request.url);
    return NextResponse.redirect(url);
  }

  // If user has no session and is trying to access a protected route, redirect to login
  if (!session && (pathname.startsWith('/admin') || pathname.startsWith('/vote'))) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Enforce strict role-based routing
  if (session) {
    // If a non-admin tries to access an admin route, redirect to voter dashboard
    if (pathname.startsWith('/admin') && !session.isAdmin) {
      return NextResponse.redirect(new URL('/vote', request.url));
    }
    // If an admin tries to access a voter route, redirect to admin dashboard
    if (pathname.startsWith('/vote') && session.isAdmin) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/admin/:path*', '/vote/:path*'],
};
