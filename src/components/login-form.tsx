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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { login } from '@/lib/actions';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const voterLoginSchema = z.object({
  voterId: z.string().min(1, { message: 'Voter ID is required.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

const adminLoginSchema = z.object({
  username: z.string().min(1, { message: 'Username is required.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

export function LoginForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('voter');

  const voterForm = useForm<z.infer<typeof voterLoginSchema>>({
    resolver: zodResolver(voterLoginSchema),
    defaultValues: { voterId: '', password: '' },
  });

  const adminForm = useForm<z.infer<typeof adminLoginSchema>>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: { username: '', password: '' },
  });

  async function handleLogin(
    values: z.infer<typeof voterLoginSchema> | z.infer<typeof adminLoginSchema>,
    role: 'voter' | 'admin'
  ) {
    setIsSubmitting(true);
    try {
      const result = await login(values, role);
      if (result.success) {
        toast({
          title: 'Login Successful',
          description: 'Redirecting to your dashboard...',
        });
        router.push(result.redirectPath);
        router.refresh();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="voter">Voter</TabsTrigger>
        <TabsTrigger value="admin">Admin</TabsTrigger>
      </TabsList>
      <TabsContent value="voter">
        <Form {...voterForm}>
          <form onSubmit={voterForm.handleSubmit((values) => handleLogin(values, 'voter'))} className="space-y-4">
            <FormField
              control={voterForm.control}
              name="voterId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Voter ID</FormLabel>
                  <FormControl>
                    <Input placeholder="Your Voter ID" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={voterForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Your Password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Login as Voter
            </Button>
          </form>
        </Form>
      </TabsContent>
      <TabsContent value="admin">
        <Form {...adminForm}>
          <form onSubmit={adminForm.handleSubmit((values) => handleLogin(values, 'admin'))} className="space-y-4">
            <FormField
              control={adminForm.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="admin" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={adminForm.control}
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
      </TabsContent>
    </Tabs>
  );
}
