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
import type { Voter, Category } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { saveVoter } from '@/lib/actions';
import { Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const voterSchema = z.object({
  id: z.string().min(1, { message: 'Voter ID is required.' }),
  name: z.string().min(3, { message: 'Name must be at least 3 characters.' }),
  category: z.string().min(1, { message: 'Category is required.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

type VoterFormData = z.infer<typeof voterSchema>;

interface VoterFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  voter: Voter | null;
  categories: Category[];
  onSave: (voter: Voter & { isNew?: boolean }) => void;
}

export function VoterFormDialog({
  open,
  onOpenChange,
  voter,
  categories,
  onSave,
}: VoterFormDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!voter;

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<VoterFormData>({
    resolver: zodResolver(voterSchema),
  });

  useEffect(() => {
    if (open) {
      if (voter) {
        reset({
          id: voter.id,
          name: voter.name,
          category: voter.category,
          password: voter.password || '',
        });
      } else {
        reset({ id: '', name: '', category: '', password: '' });
      }
    }
  }, [voter, reset, open]);
  
  const onSubmit: SubmitHandler<VoterFormData> = async (data) => {
    setIsSubmitting(true);
    try {
      const voterToSave = {
        ...data,
        isEditing,
      };
      
      const saved = await saveVoter(voterToSave);

      toast({
        title: `Voter ${isEditing ? 'updated' : 'created'}`,
        description: `"${data.name}" has been successfully saved.`,
      });
      
      onSave({ ...saved, isNew: !isEditing });
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error saving voter',
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
          <DialogTitle>{isEditing ? 'Edit Voter' : 'Add New Voter'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the details for this voter.' : 'Enter the details for the new voter.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} id="voter-form" className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="id" className="text-right">
              Voter ID
            </Label>
            <div className="col-span-3">
              <Input id="id" {...register('id')} className="w-full font-mono" disabled={isEditing} />
              {errors.id && (
                <p className="text-sm text-destructive mt-1">{errors.id.message}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <div className="col-span-3">
              <Input id="name" {...register('name')} className="w-full" />
              {errors.name && (
                <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">
              Category
            </Label>
            <div className="col-span-3">
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.category && (
                <p className="text-sm text-destructive mt-1">{errors.category.message}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="password" className="text-right">
              Password
            </Label>
            <div className="col-span-3">
              <Input id="password" type="password" {...register('password')} className="w-full" placeholder={isEditing ? 'Enter new password' : 'At least 6 characters'} />
              {errors.password && (
                <p className="text-sm text-destructive mt-1">{errors.password.message}</p>
              )}
            </div>
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="voter-form" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
