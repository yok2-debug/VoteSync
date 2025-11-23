'use client';
import { AdminSidebar } from '@/components/admin-sidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { getAdminSession } from '@/lib/session-client';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Loading from '../loading';
import type { Permission } from '@/lib/types';
import { useDatabase } from '@/context/database-context';
import { ClientOnly } from '@/components/ui/client-only';

const routePermissions: Record<string, Permission> = {
  '/admin/dashboard': 'dashboard',
  '/admin/elections': 'elections',
  '/admin/candidates': 'candidates',
  '/admin/voters': 'voters',
  '/admin/categories': 'categories',
  '/admin/recapitulation': 'recapitulation',
  '/admin/settings': 'settings',
  '/admin/users': 'users',
};

const permissionRedirectOrder: { permission: Permission; path: string }[] = [
    { permission: 'dashboard', path: '/admin/dashboard' },
    { permission: 'recapitulation', path: '/admin/recapitulation' },
    { permission: 'elections', path: '/admin/elections' },
    { permission: 'candidates', path: '/admin/candidates' },
    { permission: 'voters', path: '/admin/voters' },
    { permission: 'categories', path: '/admin/categories' },
    { permission: 'users', path: '/admin/users' },
    { permission: 'settings', path: '/admin/settings' },
];


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoading: isDbLoading, roles } = useDatabase();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const session = getAdminSession();
    
    // If no session, redirect to login
    if (!session?.userId) {
      router.replace('/admin-login');
      return;
    }
    
    // Wait for DB to load roles before checking permissions
    if (isDbLoading) return;

    const userRole = roles.find(r => r.id === session.roleId);
    const permissions = userRole?.permissions || [];

    // Check for base /admin or /admin/profile access
    if (pathname === '/admin' || pathname === '/admin/' || pathname.startsWith('/admin/profile')) {
        const firstAllowedPage = permissionRedirectOrder.find(p => permissions.includes(p.permission))?.path || '/admin-login';
        // If at base admin route, redirect to the first accessible page
        if(pathname === '/admin' || pathname === '/admin/') {
          router.replace(firstAllowedPage);
          // Don't set authorized yet, let the redirect happen
          return;
        }
        setIsAuthorized(true);
        return;
    }
    
    // Check permission for the specific route
    let hasAccess = false;
    for (const route in routePermissions) {
        if (pathname.startsWith(route)) {
            const requiredPermission = routePermissions[route];
            if (permissions.includes(requiredPermission)) {
                hasAccess = true;
            }
            break; 
        }
    }
    
    if (hasAccess) {
      setIsAuthorized(true);
    } else {
      // If user has no access, redirect them to their first available page
       const firstAllowedPage = permissionRedirectOrder.find(p => permissions.includes(p.permission))?.path || '/admin-login';
       router.replace(firstAllowedPage);
    }

  }, [pathname, router, isDbLoading, roles]);

  return (
    <SidebarProvider>
      <ClientOnly>
          <AdminSidebar />
          <SidebarInset className="bg-background">
            <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 md:justify-end">
                <div className="md:hidden">
                  <SidebarTrigger />
                </div>
                <h1 className="text-lg font-semibold md:hidden">VoteSync Admin</h1>
            </header>
            <main className="flex-1 p-4 sm:p-6">
              {isAuthorized ? children : <Loading />}
            </main>
          </SidebarInset>
      </ClientOnly>
    </SidebarProvider>
  );
}
