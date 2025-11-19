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
import { saveCategory } from '@/lib/actions';
import { Loader2 } from 'lucide-react';
import { getCategories } from '@/lib/data';

const categorySchema = z.object({
  name: z.string().min(3, { message: 'Category name must be at least 3 characters.' }),
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
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
  });

  useEffect(() => {
    if (category) {
      reset({ name: category.name });
    } else {
      reset({ name: '' });
    }
  }, [category, reset, open]);

  const onSubmit: SubmitHandler<CategoryFormData> = async (data) => {
    setIsSubmitting(true);
    try {
      const categoryToSave = {
        id: category?.id,
        name: data.name,
      };
      await saveCategory(categoryToSave);
      
      const updatedCategories = await getCategories();
      const saved = updatedCategories.find(c => c.name === data.name && (category ? c.id === category.id : true));


      toast({
        title: `Category ${category ? 'updated' : 'created'}`,
        description: `"${data.name}" has been successfully saved.`,
      });
      
      if(saved) {
        onSave({ ...saved, isNew: !category });
      }

      onOpenChange(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error saving category',
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
          <DialogTitle>{category ? 'Edit Category' : 'Add New Category'}</DialogTitle>
          <DialogDescription>
            {category ? 'Update the details for this category.' : 'Enter the name for the new category.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} id="category-form" className="grid gap-4 py-4">
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
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="category-form" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
