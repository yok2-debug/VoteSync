
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ADMIN_SESSION_COOKIE_NAME = 'votesync_admin_session';

function getAdminSessionFromCookie(request: NextRequest) {
  const sessionCookie = request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;
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
  const adminSession = getAdminSessionFromCookie(request);
  const { pathname } = request.nextUrl;

  // Protect /admin routes
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin-login')) {
    if (!adminSession) {
      return NextResponse.redirect(new URL('/admin-login', request.url));
    }
  }
  
  // Redirect logged-in admin from admin-login page
  if (pathname === '/admin-login' && adminSession) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  // Voter routes are handled client-side with localStorage, so middleware doesn't protect them.
  // The redirection logic is inside the pages themselves.

  return NextResponse.next();
}

export const config = {
  // Apply middleware to all admin paths and the admin login page
  matcher: ['/admin/:path*', '/admin-login'],
};
