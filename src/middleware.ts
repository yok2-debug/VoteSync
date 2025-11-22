
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { type AdminSessionPayload, type Permission } from './lib/types';
import { getAdminSession } from './lib/session';

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

async function hasPermission(session: AdminSessionPayload | null, path: string): Promise<boolean> {
    if (!session || !Array.isArray(session.permissions)) {
      return false;
    }

    for (const route in routePermissions) {
        if (path.startsWith(route)) {
            const requiredPermission = routePermissions[route];
            return session.permissions.includes(requiredPermission);
        }
    }
    
    if (path === '/admin' || path === '/admin/') {
        return true;
    }

    return false;
}

export async function middleware(request: NextRequest) {
  const session = await getAdminSession();
  const { pathname } = request.nextUrl;

  const isApiRoute = pathname.startsWith('/api/');
  if (isApiRoute) {
    return NextResponse.next();
  }
  
  const isPublicAdminPage = pathname.startsWith('/admin-login');

  // If user is logged in
  if (session) {
    // If they are on a public admin page (like login), redirect them to the dashboard
    if (isPublicAdminPage) {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
    
    // For all other admin pages, check for permissions
    const userHasPermission = await hasPermission(session, pathname);
    if (!userHasPermission) {
        // Redirect to dashboard with an error if they lack permissions
        return NextResponse.redirect(new URL('/admin/dashboard?error=permission_denied', request.url));
    }
  } 
  // If user is NOT logged in
  else {
    // And they are trying to access a protected admin page
    if (pathname.startsWith('/admin') && !isPublicAdminPage) {
        // Redirect them to the login page
        return NextResponse.redirect(new URL('/admin-login', request.url));
    }
  }


  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/admin-login'],
};
