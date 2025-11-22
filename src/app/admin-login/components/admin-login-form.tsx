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
import { getAdminUsers, getRoles } from '@/lib/data';
import { setAdminSession } from '@/lib/session-client';
import { createAdminSession } from '@/lib/session';

const adminLoginSchema = z.object({
  username: z.string().min(1, { message: 'Username is required.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

export function AdminLoginForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof adminLoginSchema>>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: { username: '', password: '' },
  });

  async function handleAdminLogin(values: z.infer<typeof adminLoginSchema>) {
    setIsSubmitting(true);
    try {
        const [users, roles] = await Promise.all([getAdminUsers(), getRoles()]);
        const user = users.find(u => u.username === values.username);
        
        if (!user || user.password !== values.password) {
          throw new Error('Nama pengguna atau kata sandi tidak valid.');
        }

        const role = roles.find(r => r.id === user.roleId);
        if (!role || !role.permissions) {
            throw new Error('Konfigurasi peran pengguna tidak valid atau tidak memiliki hak akses.');
        }

        const sessionPayload = {
            userId: user.id,
            username: user.username,
            permissions: role.permissions,
        };

        await createAdminSession(sessionPayload);
        // Also save a copy to localStorage for client-side access
        setAdminSession(sessionPayload);
        
        toast({
            title: 'Login Berhasil',
            description: 'Mengarahkan ke dasbor Anda...',
        });
        router.push('/admin/dashboard');
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
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Login as Admin
        </Button>
      </form>
    </Form>
  );
}
