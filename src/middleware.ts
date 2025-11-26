
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
    // '/admin/profile' akan ditangani secara terpisah
};

async function hasPermission(session: AdminSessionPayload | null, path: string): Promise<boolean> {
    if (!session || !Array.isArray(session.permissions)) {
      return false;
    }
    
    // Izinkan akses ke halaman profil jika pengguna memiliki setidaknya satu izin
    if (path.startsWith('/admin/profile')) {
      return session.permissions.length > 0;
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

async function getSessionFromCookie(request: NextRequest): Promise<AdminSessionPayload | null> {
    const sessionCookie = request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;
    if (!sessionCookie) {
        return null;
    }
    try {
        const parsed = JSON.parse(sessionCookie);
        if (parsed.expires && parsed.expires < Date.now()) {
            // Cookie is expired, treat as no session
            return null;
        }
        return parsed;
    } catch (error) {
        return null;
    }
}

export async function middleware(request: NextRequest) {
  const session = await getSessionFromCookie(request);
  const { pathname } = request.nextUrl;

  const isApiRoute = pathname.startsWith('/api/');
  if (isApiRoute) {
    return NextResponse.next();
  }
  
  const isPublicAdminPage = pathname.startsWith('/admin-login');

  // Jika pengguna sudah login
  if (session) {
    // Jika mereka berada di halaman login publik, arahkan mereka
    if (isPublicAdminPage) {
        // Logika pengalihan cerdas akan ditangani di sisi klien setelah login berhasil
        // Cukup arahkan ke dasbor sebagai default jika sesi sudah ada
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
    
    // Untuk semua halaman admin lainnya, periksa izin
    const userHasPermission = await hasPermission(session, pathname);
    if (!userHasPermission) {
        // Arahkan ke dasbor dengan error jika mereka kekurangan izin
        // Dasbor akan menangani pengalihan lebih lanjut jika diperlukan
        return NextResponse.redirect(new URL('/admin/dashboard?error=permission_denied', request.url));
    }
  } 
  // Jika pengguna BELUM login
  else {
    // Dan mereka mencoba mengakses halaman admin yang dilindungi
    if (pathname.startsWith('/admin') && !isPublicAdminPage) {
        // Arahkan mereka ke halaman login
        return NextResponse.redirect(new URL('/admin-login', request.url));
    }
  }


  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/admin-login'],
};

    