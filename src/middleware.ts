import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAdminSession, getVoterSession } from '@/lib/get-session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const adminSession = await getAdminSession();
  const voterSession = await getVoterSession();

  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin-login') {
      if (adminSession) {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }
      return NextResponse.next();
    }
    
    if (!adminSession) {
      return NextResponse.redirect(new URL('/admin-login', request.url));
    }
  }

  if (pathname.startsWith('/vote')) {
    if (!voterSession) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

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
