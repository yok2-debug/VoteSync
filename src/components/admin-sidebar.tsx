'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/logo';
import {
  BarChart2,
  Box,
  ChevronDown,
  FileText,
  Home,
  LogOut,
  Settings,
  Users,
  Vote,
  User,
  Shield,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { getAdminSession, deleteAdminSession } from '@/lib/session-client';
import { useEffect, useState, useTransition } from 'react';
import type { AdminSessionPayload } from '@/lib/types';
import { useDatabase } from '@/context/database-context';

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const avatar = PlaceHolderImages.find(p => p.id === 'default-avatar');
  const [session, setSession] = useState<AdminSessionPayload | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const { roles, isLoading: isDbLoading } = useDatabase();
  
  useEffect(() => {
    const currentSession = getAdminSession();
    setSession(currentSession);
    if(currentSession && !isDbLoading && roles.length > 0) {
      const userRole = roles.find(r => r.id === currentSession.roleId);
      setPermissions(userRole?.permissions || []);
    }
  }, [pathname, isDbLoading, roles]);


  const handleLogout = () => {
    startTransition(() => {
        deleteAdminSession();
        toast({ title: "Logout Berhasil", description: "Anda telah berhasil keluar." });
        router.push('/admin-login');
        router.refresh();
    });
  };

  const menuItems = [
    { href: '/admin/dashboard', icon: <Home />, label: 'Dasbor', permission: 'dashboard' },
    { href: '/admin/elections', icon: <Vote />, label: 'Pemilihan', permission: 'elections' },
    { href: '/admin/candidates', icon: <Users />, label: 'Kandidat', permission: 'candidates' },
    { href: '/admin/voters', icon: <Users />, label: 'Pemilih', permission: 'voters' },
    { href: '/admin/categories', icon: <Box />, label: 'Kategori', permission: 'categories' },
    { href: '/admin/recapitulation', icon: <FileText />, label: 'Rekapitulasi', permission: 'recapitulation' },
  ];

  const userManagementItems = [
      { href: '/admin/users', icon: <User />, label: 'Pengguna', permission: 'users' },
      { href: '/admin/users/roles', icon: <Shield />, label: 'Peran', permission: 'users' },
  ]
  
  const settingsItem = { href: '/admin/settings', icon: <Settings />, label: 'Pengaturan', permission: 'settings' };

  const hasPermission = (permission: string) => permissions.includes(permission);

  return (
    <Sidebar>
      <SidebarHeader className="h-14 justify-center">
        <div className="flex items-center gap-2">
          <Logo />
          <span className="text-lg font-semibold">VoteSync</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.filter(item => hasPermission(item.permission)).map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                onClick={() => router.push(item.href)}
                isActive={pathname.startsWith(item.href)}
                tooltip={item.label}
              >
                {item.icon}
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          
          {hasPermission('users') && (
            <SidebarGroup>
              <SidebarGroupLabel>Manajemen Pengguna</SidebarGroupLabel>
              {userManagementItems.map((item) => (
                 <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    onClick={() => router.push(item.href)}
                    isActive={pathname.startsWith(item.href)}
                    tooltip={item.label}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarGroup>
          )}

          {hasPermission(settingsItem.permission) && (
             <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => router.push(settingsItem.href)}
                isActive={pathname.startsWith(settingsItem.href)}
                tooltip={settingsItem.label}
              >
                {settingsItem.icon}
                <span>{settingsItem.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex h-12 w-full items-center justify-start gap-2 px-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={avatar?.imageUrl} alt="Admin" data-ai-hint={avatar?.imageHint} />
                <AvatarFallback>{session?.username?.[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium">{session?.username || 'User'}</span>
                <span className="text-xs text-muted-foreground">{roles.find(r => r.id === session?.roleId)?.name || 'Admin Role'}</span>
              </div>
              <ChevronDown className="ml-auto h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 mb-2" side="top" align="start">
            <DropdownMenuLabel>Akun Saya</DropdownMenuLabel>
            <DropdownMenuSeparator />
             <DropdownMenuItem onClick={() => router.push('/admin/profile')}>
              <User className="mr-2 h-4 w-4" />
              <span>Ubah Kata Sandi</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500 focus:bg-red-500/10" disabled={isPending}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Keluar</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
