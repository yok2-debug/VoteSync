'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
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
  UserSquare,
  User as UserIcon,
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
import { deleteAdminSession } from '@/lib/session';

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const avatar = PlaceHolderImages.find(p => p.id === 'default-avatar');

  const handleLogout = async () => {
    try {
      await deleteAdminSession();
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out.',
      });
      router.push('/admin-login');
      router.refresh();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Logout Failed',
        description: 'An error occurred while logging out.',
      });
    }
  };

  const menuItems = [
    { href: '/admin/dashboard', icon: <Home />, label: 'Dasbor' },
    { href: '/admin/elections', icon: <Vote />, label: 'Pemilihan' },
    { href: '/admin/candidates', icon: <UserSquare />, label: 'Kandidat' },
    { href: '/admin/voters', icon: <Users />, label: 'Pemilih' },
    { href: '/admin/categories', icon: <Box />, label: 'Kategori' },
    { href: '/admin/recapitulation', icon: <FileText />, label: 'Rekapitulasi' },
    { href: '/admin/settings', icon: <Settings />, label: 'Pengaturan' },
  ];

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
          {menuItems.map((item) => (
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
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex h-12 w-full items-center justify-start gap-2 px-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={avatar?.imageUrl} alt="Admin" data-ai-hint={avatar?.imageHint} />
                <AvatarFallback>A</AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium">Administrator</span>
                <span className="text-xs text-muted-foreground">Peran Admin</span>
              </div>
              <ChevronDown className="ml-auto h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 mb-2" side="top" align="start">
            <DropdownMenuLabel>Akun Saya</DropdownMenuLabel>
            <DropdownMenuSeparator />
             <DropdownMenuItem onClick={() => router.push('/admin/profile')}>
              <UserIcon className="mr-2 h-4 w-4" />
              <span>Ubah Kata Sandi</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500 focus:bg-red-500/10">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Keluar</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
