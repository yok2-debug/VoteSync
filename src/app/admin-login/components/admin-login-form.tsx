'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setAdminSession } from '@/lib/session-client';
import type { Permission, AdminUser } from '@/lib/types';
import { useDatabase } from '@/context/database-context';

const adminLoginSchema = z.object({
  username: z.string().min(1, { message: 'Username is required.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

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

function getRedirectPath(permissions: Permission[]): string | null {
    if (!permissions || permissions.length === 0) {
        return null;
    }
    for (const route of permissionRedirectOrder) {
        if (permissions.includes(route.permission)) {
            return route.path;
        }
    }
    return null; 
}


export function AdminLoginForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { adminUsers, roles } = useDatabase();

  const form = useForm<z.infer<typeof adminLoginSchema>>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: { username: '', password: '' },
  });

  async function handleAdminLogin(values: z.infer<typeof adminLoginSchema>) {
    setIsSubmitting(true);
    try {
        const user = adminUsers.find(u => u.username === values.username);
        
        if (!user || user.password !== values.password) {
          throw new Error('Nama pengguna atau kata sandi tidak valid.');
        }

        const role = roles.find(r => r.id === user.roleId);
        if (!role || !role.permissions || role.permissions.length === 0) {
            throw new Error('Konfigurasi peran pengguna tidak valid atau tidak memiliki hak akses.');
        }

        const sessionPayload = {
            userId: user.id,
            username: user.username,
            roleId: user.roleId,
        };

        setAdminSession(sessionPayload);
        
        const redirectPath = getRedirectPath(role.permissions);

        if (!redirectPath) {
             throw new Error('Tidak ada halaman yang dapat diakses ditemukan untuk peran Anda.');
        }

        toast({
            title: 'Login Berhasil',
            description: 'Mengarahkan ke halaman Anda...',
        });

        router.push(redirectPath);
        router.refresh();

    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Login Gagal',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan tidak diketahui.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleAdminLogin)} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="username" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting || adminUsers.length === 0}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Login as Admin
        </Button>
      </form>
    </Form>
  );
}
