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
import { getVoters } from '@/lib/data';
import { setVoterSession } from '@/lib/session-client';

const voterLoginSchema = z.object({
  voterId: z.string().min(1, { message: 'Voter ID is required.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

export function LoginForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof voterLoginSchema>>({
    resolver: zodResolver(voterLoginSchema),
    defaultValues: { voterId: '', password: '' },
  });

  async function handleVoterLogin(values: z.infer<typeof voterLoginSchema>) {
    setIsSubmitting(true);
    try {
      const allVoters = await getVoters();
      const voter = allVoters.find(v => v.id === values.voterId);

      if (voter && voter.password === values.password) {
        setVoterSession({ voterId: voter.id });

        toast({
          title: 'Login Successful',
          description: 'Redirecting to your dashboard...',
        });
        
        router.push('/vote');
      } else {
        throw new Error('Invalid voter ID or password.');
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleVoterLogin)} className="space-y-4">
        <FormField
          control={form.control}
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
          control={form.control}
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
          Login
        </Button>
      </form>
    </Form>
  );
}
