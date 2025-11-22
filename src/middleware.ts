
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { type AdminSessionPayload, type Permission } from './lib/types';

const ADMIN_SESSION_COOKIE_NAME = 'votesync_admin_session';

const routePermissions: Record<string, Permission> = {
    '/admin/dashboard': 'dashboard',
    '/admin/elections': 'elections',
    '/admin/candidates': 'candidates',
    '/admin/voters': 'voters',
    '/admin/categories': 'categories',
    '/admin/recapitulation': 'recapitulation',
    '/admin/settings': 'settings',
    '/admin/users': 'users',
    '/admin/profile': 'dashboard', // Allow profile access if they can see the dashboard
};

function getAdminSessionFromCookie(request: NextRequest): AdminSessionPayload | null {
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

function hasPermission(session: AdminSessionPayload | null, path: string): boolean {
    if (!session || !session.permissions) return false;

    for (const route in routePermissions) {
        if (path.startsWith(route)) {
            const requiredPermission = routePermissions[route];
            return session.permissions.includes(requiredPermission);
        }
    }
    
    // For admin root, just check if they are logged in
    if (path === '/admin' || path === '/admin/') {
        return true;
    }

    return false;
}

export function middleware(request: NextRequest) {
  const session = getAdminSessionFromCookie(request);
  const { pathname } = request.nextUrl;

  const isApiRoute = pathname.startsWith('/api/');

  if (isApiRoute) {
    return NextResponse.next();
  }

  // Protect /admin routes
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin-login')) {
    if (!session) {
      return NextResponse.redirect(new URL('/admin-login', request.url));
    }
    if (!hasPermission(session, pathname)) {
        // Redirect to a more appropriate page like dashboard if they try to access a forbidden page
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
  }
  
  // Redirect logged-in admin from admin-login page
  if (pathname === '/admin-login' && session) {
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
