import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  const adminCookie = request.cookies.get('votesync_admin_session');
  const voterCookie = request.cookies.get('votesync_voter_session');

  const adminSession = adminCookie ? JSON.parse(adminCookie.value) : null;
  const voterSession = voterCookie ? JSON.parse(voterCookie.value) : null;

  // Admin routes protection
  if (pathname.startsWith('/admin')) {
    // If user is logged in and tries to access login page, redirect to dashboard
    if (pathname === '/admin-login') {
      if (adminSession) {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }
      return NextResponse.next();
    }
    
    // If user is not logged in, redirect to login page
    if (!adminSession) {
      return NextResponse.redirect(new URL('/admin-login', request.url));
    }

    // If user is logged in and accesses the base /admin path, redirect to dashboard
    if (pathname === '/admin' || pathname === '/admin/') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
  }

  // Voter routes protection
  if (pathname.startsWith('/vote')) {
    if (!voterSession) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // If a logged-in voter tries to access the home/login page, redirect to their dashboard
  if (pathname === '/' || pathname === '/real-count') {
      if (voterSession) {
          return NextResponse.redirect(new URL('/vote', request.url));
      }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
