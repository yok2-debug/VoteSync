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

  const isLoginPage = pathname === '/';
  const isAdminLoginPage = pathname === '/admin-login';

  // If a voter has a session and is on the main login page, redirect to their dashboard.
  if (voterSession && isLoginPage) {
    return NextResponse.redirect(new URL('/vote', request.url));
  }
  
  // If an admin has a session and is on the admin-login page, redirect to their dashboard.
  if (adminSession && isAdminLoginPage) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  // Protected routes
  const isAccessingAdminArea = pathname.startsWith('/admin');
  const isAccessingVoteArea = pathname.startsWith('/vote');

  // If user tries to access admin area without admin session, redirect to admin login
  if (isAccessingAdminArea && !adminSession) {
    return NextResponse.redirect(new URL('/admin-login', request.url));
  }
  
  // If user tries to access vote area without voter session, redirect to main login
  if (isAccessingVoteArea && !voterSession) {
     return NextResponse.redirect(new URL('/', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/admin/:path*', '/vote/:path*', '/admin-login'],
};
