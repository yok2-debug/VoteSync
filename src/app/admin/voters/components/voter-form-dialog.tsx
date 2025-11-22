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
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEffect, useState } from 'react';
import type { Voter, Category } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { db } from '@/lib/firebase';
import { ref, get, set } from 'firebase/database';

const voterSchema = z.object({
  id: z.string().min(1, { message: 'Voter ID is required.' }),
  name: z.string().min(3, { message: 'Name must be at least 3 characters.' }),
  category: z.string().min(1, { message: 'Category is required.' }),
  password: z.string().optional(),
  nik: z.string().optional(),
  birthPlace: z.string().optional(),
  birthDate: z.string().optional(),
  gender: z.enum(['Laki-laki', 'Perempuan']).optional(),
  address: z.string().optional(),
});

type VoterFormData = z.infer<typeof voterSchema>;

interface VoterFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  voter: Voter | null;
  categories: Category[];
  onSave: (voter: Voter) => Promise<void>;
}

export function VoterFormDialog({
  open,
  onOpenChange,
  voter,
  categories,
  onSave,
}: VoterFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!voter;
  const { toast } = useToast();

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
          ...voter,
          password: '', // Always start with empty password field for editing
        });
      } else {
        reset({ 
          id: '', 
          name: '', 
          category: '', 
          password: '',
          nik: '',
          birthPlace: '',
          birthDate: '',
          gender: undefined,
          address: '',
        });
      }
    }
  }, [voter, reset, open]);
  
  const onSubmit: SubmitHandler<VoterFormData> = async (data) => {
    setIsSubmitting(true);
    try {
      const voterRef = ref(db, `voters/${data.id}`);
  
      if (!isEditing) {
        const existingVoterSnapshot = await get(voterRef);
        if (existingVoterSnapshot.exists()) {
          throw new Error(`Voter with ID "${data.id}" already exists.`);
        }
      }
      
      let passwordToSave = data.password;
      if (!passwordToSave) {
        if (isEditing) {
          const snapshot = await get(voterRef);
          passwordToSave = snapshot.val()?.password;
        } else {
          passwordToSave = Math.random().toString(36).substring(2, 8);
        }
      }

      const savedVoter: Voter = {
        ...data,
        password: passwordToSave,
      };
      
      await onSave(savedVoter);
      
      toast({
        title: `Voter ${isEditing ? 'updated' : 'created'}`,
        description: `"${savedVoter.name}" has been successfully saved.`,
      });

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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Voter' : 'Add New Voter'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the details for this voter.' : 'Enter the details for the new voter.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} id="voter-form" className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto px-1">
          <div className="space-y-2">
            <Label htmlFor="id">Voter ID</Label>
            <Input id="id" {...register('id')} className="w-full font-mono" disabled={isEditing} />
            {errors.id && <p className="text-sm text-destructive mt-1">{errors.id.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="nik">NIK</Label>
            <Input id="nik" {...register('nik')} className="w-full font-mono" />
            {errors.nik && <p className="text-sm text-destructive mt-1">{errors.nik.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...register('name')} className="w-full" />
            {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
          </div>
           <div className="space-y-2">
            <Label htmlFor="birthPlace">Tempat Lahir</Label>
            <Input id="birthPlace" {...register('birthPlace')} className="w-full" />
            {errors.birthPlace && <p className="text-sm text-destructive mt-1">{errors.birthPlace.message}</p>}
          </div>
           <div className="space-y-2">
            <Label htmlFor="birthDate">Tanggal Lahir (DD-MM-YYYY)</Label>
            <Input id="birthDate" {...register('birthDate')} className="w-full" placeholder="Contoh: 31-12-1990" />
            {errors.birthDate && <p className="text-sm text-destructive mt-1">{errors.birthDate.message}</p>}
          </div>
           <div className="space-y-2">
             <Label>Jenis Kelamin</Label>
              <Controller
                control={control}
                name="gender"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jenis kelamin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                      <SelectItem value="Perempuan">Perempuan</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.gender && <p className="text-sm text-destructive mt-1">{errors.gender.message}</p>}
           </div>
            <div className="space-y-2">
                <Label htmlFor="address">Alamat</Label>
                <Textarea id="address" {...register('address')} />
                {errors.address && <p className="text-sm text-destructive mt-1">{errors.address.message}</p>}
            </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
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
            {errors.category && <p className="text-sm text-destructive mt-1">{errors.category.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password" 
              type="password" 
              {...register('password')} 
              className="w-full" 
              placeholder={isEditing ? "Leave blank to keep current" : "Leave blank for auto-generation"}
            />
            {errors.password && <p className="text-sm text-destructive mt-1">{errors.password.message}</p>}
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
