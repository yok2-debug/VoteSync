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
import type { Category, Election } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { getCategories } from '@/lib/data';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { db } from '@/lib/firebase';
import { ref, push, set } from 'firebase/database';

const categorySchema = z.object({
  name: z.string().min(3, { message: 'Category name must be at least 3 characters.' }),
  allowedElections: z.array(z.string()).optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
  onSave: (category: Category & { isNew?: boolean }) => void;
  allElections: Election[];
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  onSave,
  allElections,
}: CategoryFormDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
  });

  useEffect(() => {
    if (category) {
      form.reset({ name: category.name, allowedElections: category.allowedElections || [] });
    } else {
      form.reset({ name: '', allowedElections: [] });
    }
  }, [category, form, open]);

  const onSubmit: SubmitHandler<CategoryFormData> = async (data) => {
    setIsSubmitting(true);
    try {
      const categoryToSave = {
        id: category?.id,
        name: data.name,
        allowedElections: data.allowedElections || [],
      };

      const dataToSave = {
        name: categoryToSave.name,
        allowedElections: categoryToSave.allowedElections || [],
      };
      let categoryId = categoryToSave.id;
      if (!categoryId) {
        categoryId = push(ref(db, 'categories')).key!;
      }
      await set(ref(db, `categories/${categoryId}`), dataToSave);
      
      const saved = { ...dataToSave, id: categoryId };


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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{category ? 'Edit Category' : 'Add New Category'}</DialogTitle>
          <DialogDescription>
            {category ? 'Update the details for this category.' : 'Enter the details for the new category.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} id="category-form" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Category Name
              </Label>
              <Input id="name" {...form.register('name')} className="w-full" />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>
              )}
            </div>
            
             <FormField
                control={form.control}
                name="allowedElections"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="text-base">Allowed Elections</FormLabel>
                      <DialogDescription>
                        Select the elections this category can vote in.
                      </DialogDescription>
                    </div>
                    <ScrollArea className="h-40 w-full rounded-md border p-4">
                      {allElections.length > 0 ? allElections.map((item) => (
                        <FormField
                          key={item.id}
                          control={form.control}
                          name="allowedElections"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={item.id}
                                className="flex flex-row items-start space-x-3 space-y-0 mb-3"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(item.id)}
                                    onCheckedChange={(checked) => {
                                      const currentValue = field.value || [];
                                      return checked
                                        ? field.onChange([...currentValue, item.id])
                                        : field.onChange(
                                            currentValue?.filter(
                                              (value) => value !== item.id
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {item.name}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      )) : <p className="text-sm text-muted-foreground">No elections available.</p>}
                    </ScrollArea>
                    {form.formState.errors.allowedElections && (
                      <p className="text-sm text-destructive mt-1">{form.formState.errors.allowedElections.message}</p>
                    )}
                  </FormItem>
                )}
              />
          </form>
        </Form>
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
