'use client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEffect, useState } from 'react';
import type { Voter } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { resetVoterPassword } from '@/lib/actions';
import { Loader2 } from 'lucide-react';

const passwordSchema = z.object({
  password: z.string().min(6, { message: 'New password must be at least 6 characters.' }),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});


type PasswordFormData = z.infer<typeof passwordSchema>;

interface ResetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  voter: Voter;
}

export function ResetPasswordDialog({
  open,
  onOpenChange,
  voter,
}: ResetPasswordDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    if(open) {
      reset({ password: '', confirmPassword: '' });
    }
  }, [open, reset]);

  const onSubmit: SubmitHandler<PasswordFormData> = async (data) => {
    setIsSubmitting(true);
    try {
      await resetVoterPassword(voter.id, data.password);
      toast({
        title: 'Password Reset Successful',
        description: `Password for ${voter.name} has been updated.`,
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error Resetting Password',
        description: error instanceof Error ? error.message : 'An unknown error occurred.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>
            Enter a new password for <span className="font-semibold">{voter.name}</span> ({voter.id}).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} id="reset-password-form" className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="password-reset" className="text-right">
              New Password
            </Label>
            <div className="col-span-3">
              <Input id="password-reset" type="password" {...register('password')} className="w-full" />
              {errors.password && (
                <p className="text-sm text-destructive mt-1">{errors.password.message}</p>
              )}
            </div>
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="confirmPassword" className="text-right">
              Confirm
            </Label>
            <div className="col-span-3">
              <Input id="confirmPassword" type="password" {...register('confirmPassword')} className="w-full" />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="reset-password-form" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Saving...' : 'Set New Password'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
