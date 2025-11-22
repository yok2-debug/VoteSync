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
import type { Category } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { ref, push, set } from 'firebase/database';

const categorySchema = z.object({
  name: z.string().min(3, { message: 'Nama kategori minimal 3 karakter.' }),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
  onSave: (category: Category & { isNew?: boolean }) => void;
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  onSave,
}: CategoryFormDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
  });

  useEffect(() => {
    if (category) {
      form.reset({ name: category.name });
    } else {
      form.reset({ name: '' });
    }
  }, [category, form, open]);

  const onSubmit: SubmitHandler<CategoryFormData> = async (data) => {
    setIsSubmitting(true);
    try {
      const categoryToSave = {
        id: category?.id,
        name: data.name,
      };

      const dataToSave = {
        name: categoryToSave.name,
      };
      let categoryId = categoryToSave.id;
      if (!categoryId) {
        categoryId = push(ref(db, 'categories')).key!;
      }
      await set(ref(db, `categories/${categoryId}`), dataToSave);
      
      const saved = { ...dataToSave, id: categoryId };


      toast({
        title: `Kategori ${category ? 'diperbarui' : 'dibuat'}`,
        description: `"${data.name}" telah berhasil disimpan.`,
      });
      
      if(saved) {
        onSave({ ...saved, isNew: !category });
      }

      onOpenChange(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error menyimpan kategori',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan tidak diketahui.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{category ? 'Ubah Kategori' : 'Tambah Kategori Baru'}</DialogTitle>
          <DialogDescription>
            {category ? 'Perbarui detail untuk kategori ini.' : 'Masukkan detail untuk kategori baru.'}
          </DialogDescription>
        </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} id="category-form" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Nama Kategori
              </Label>
              <Input id="name" {...form.register('name')} className="w-full" />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>
              )}
            </div>
          </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Batal
          </Button>
          <Button type="submit" form="category-form" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
