
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ADMIN_SESSION_COOKIE_NAME = 'votesync_admin_session';
const VOTER_SESSION_COOKIE_NAME = 'votesync_voter_session';

function getSessionFromCookie(request: NextRequest, cookieName: string) {
  const sessionCookie = request.cookies.get(cookieName)?.value;
  if (!sessionCookie) return null;
  try {
    const session = JSON.parse(sessionCookie);
    if (session?.expires && session.expires < Date.now()) {
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const adminSession = getSessionFromCookie(request, ADMIN_SESSION_COOKIE_NAME);
  const voterSession = getSessionFromCookie(request, VOTER_SESSION_COOKIE_NAME);
  const { pathname } = request.nextUrl;

  // Protect /admin routes
  if (pathname.startsWith('/admin/') && !adminSession) {
    return NextResponse.redirect(new URL('/admin-login', request.url));
  }

  // Protect /vote routes
  if (pathname.startsWith('/vote') && !voterSession) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Redirect logged-in admin from admin-login page
  if (pathname === '/admin-login' && adminSession) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }
  
  // Redirect logged-in voter from main login page
  if (pathname === '/' && voterSession) {
    return NextResponse.redirect(new URL('/vote', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Apply middleware to all relevant paths
  matcher: ['/', '/admin/:path*', '/vote/:path*', '/admin-login'],
};
