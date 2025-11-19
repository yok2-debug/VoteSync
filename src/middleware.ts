
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

  const isAccessingAdminArea = pathname.startsWith('/admin');
  const isAccessingVoteArea = pathname.startsWith('/vote');

  // If a voter is already logged in, redirect them from the main login page to their dashboard.
  if (voterSession && pathname === '/') {
    return NextResponse.redirect(new URL('/vote', request.url));
  }
  
  // If an admin is already logged in, redirect them from the admin login page to their dashboard.
  if (adminSession && pathname === '/admin-login') {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  // If a non-admin user tries to access the admin area, redirect to the admin login page.
  if (isAccessingAdminArea && !adminSession) {
    return NextResponse.redirect(new URL('/admin-login', request.url));
  }
  
  // If a non-voter user tries to access the voting area, redirect to the main login page.
  if (isAccessingVoteArea && !voterSession) {
     return NextResponse.redirect(new URL('/', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  // Apply middleware to all relevant paths
  matcher: ['/', '/admin/:path*', '/vote/:path*', '/admin-login'],
};
