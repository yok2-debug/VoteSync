'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEffect, useState } from 'react';
import type { Candidate } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { MarkdownEditor } from '@/components/ui/markdown-editor';
import { db } from '@/lib/firebase';
import { ref, set, get, push, update } from 'firebase/database';

const candidateSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, { message: 'Candidate name must be at least 3 characters.' }),
  viceCandidateName: z.string().optional(),
  vision: z.string().optional(),
  mission: z.string().optional(),
  orderNumber: z.coerce.number().min(1, 'Order number is required'),
  photo: z.string().optional(),
});

type CandidateFormData = z.infer<typeof candidateSchema>;

interface CandidateFormProps {
  initialData: Candidate | null;
  electionId: string;
}

export function CandidateForm({
  initialData,
  electionId,
}: CandidateFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CandidateFormData>({
    resolver: zodResolver(candidateSchema),
  });

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    } else {
      reset({ name: '', viceCandidateName: '', vision: '', mission: '', orderNumber: 1, photo: '' });
    }
  }, [initialData, reset]);

  const onSubmit: SubmitHandler<CandidateFormData> = async (data) => {
    setIsSubmitting(true);
    try {
      const candidatesRef = ref(db, `elections/${electionId}/candidates`);
      const snapshot = await get(candidatesRef);
      const existingCandidates = snapshot.val() || {};

      const isOrderNumberTaken = Object.entries(existingCandidates).some(
        ([key, c]: [string, any]) => c.orderNumber === data.orderNumber && key !== data.id
      );

      if (isOrderNumberTaken) {
        throw new Error(`Order number ${data.orderNumber} is already taken in this election.`);
      }

      let candidateId = data.id;
      if (isEditing && candidateId) {
        await update(ref(db, `elections/${electionId}/candidates/${candidateId}`), data);
      } else {
        const newCandidateRef = push(candidatesRef);
        candidateId = newCandidateRef.key!;
        await set(newCandidateRef, data);
      }

      toast({
        title: `Candidate ${isEditing ? 'updated' : 'created'}`,
        description: `"${data.name}" has been successfully saved.`,
      });
      
      router.push(`/admin/candidates?electionId=${electionId}`);
      router.refresh();

    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error saving candidate',
        description: error instanceof Error ? error.message : 'An unknown error occurred.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="name">Candidate Name</Label>
            <Input id="name" {...register('name')} />
            {errors.name && (
              <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="viceCandidateName">Vice Candidate Name (Optional)</Label>
            <Input id="viceCandidateName" {...register('viceCandidateName')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="orderNumber">Order Number</Label>
            <Input id="orderNumber" type="number" {...register('orderNumber')} />
            {errors.orderNumber && (
              <p className="text-sm text-destructive mt-1">{errors.orderNumber.message}</p>
            )}
          </div>
           <div className="space-y-2">
            <Label htmlFor="photo">Photo URL (Optional)</Label>
            <Input id="photo" {...register('photo')} placeholder="https://example.com/photo.jpg" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vision & Mission</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
              <Label htmlFor="vision">Vision</Label>
              <Controller
                name="vision"
                control={control}
                render={({ field }) => <MarkdownEditor {...field} />}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mission">Mission</Label>
              <Controller
                name="mission"
                control={control}
                render={({ field }) => <MarkdownEditor {...field} />}
              />
            </div>
        </CardContent>
      </Card>


      <div className="flex justify-end gap-2">
          <Button variant="outline" type="button" onClick={() => router.push(`/admin/candidates?electionId=${electionId}`)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Saving...' : 'Save Candidate'}
          </Button>
      </div>
    </form>
  );
}
