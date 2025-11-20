'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import type { Candidate, Election } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { saveCandidate } from '@/lib/actions';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { MarkdownEditor } from '@/components/ui/markdown-editor';

const candidateSchema = z.object({
  id: z.string().optional(),
  electionId: z.string().min(1, { message: 'Election must be selected.' }),
  name: z.string().min(3, { message: 'Candidate name must be at least 3 characters.' }),
  viceCandidateName: z.string().optional(),
  vision: z.string().optional(),
  mission: z.string().optional(),
  photo: z.string().optional(),
});

type CandidateFormData = z.infer<typeof candidateSchema>;

interface CandidateFormProps {
  initialData: { candidate: Partial<Candidate>, electionId?: string } | null;
  allElections: Election[];
}

export function CandidateForm({
  initialData,
  allElections,
}: CandidateFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!initialData?.candidate?.id;

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<CandidateFormData>({
    resolver: zodResolver(candidateSchema),
  });

  useEffect(() => {
    if (initialData) {
      reset({
          id: initialData.candidate.id,
          electionId: initialData.electionId || '',
          name: initialData.candidate.name || '',
          viceCandidateName: initialData.candidate.viceCandidateName || '',
          vision: initialData.candidate.vision || '',
          mission: initialData.candidate.mission || '',
          photo: initialData.candidate.photo || '',
      });
    } else {
      reset({ id: `new-${Date.now()}`, electionId: '', name: '', viceCandidateName: '', vision: '', mission: '', photo: '' });
    }
  }, [initialData, reset]);

  const onSubmit: SubmitHandler<CandidateFormData> = async (data) => {
    setIsSubmitting(true);
    try {
      const candidateToSave: Candidate = {
        id: data.id || `new-${Date.now()}`,
        name: data.name,
        viceCandidateName: data.viceCandidateName,
        vision: data.vision,
        mission: data.mission,
        photo: data.photo,
      };

      await saveCandidate(candidateToSave, data.electionId);

      toast({
        title: `Candidate ${isEditing ? 'updated' : 'created'}`,
        description: `"${data.name}" has been successfully saved.`,
      });
      
      router.push('/admin/candidates');
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
          <CardHeader>
              <CardTitle>{isEditing ? 'Edit Candidate' : 'Add New Candidate'}</CardTitle>
              <CardDescription>
                  {isEditing ? 'Update the details for this candidate.' : 'Enter the details for the new candidate.'}
              </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
           <div className="space-y-2">
              <Label htmlFor="electionId">Election</Label>
               <Controller
                control={control}
                name="electionId"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isEditing}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an election" />
                    </SelectTrigger>
                    <SelectContent>
                      {allElections.map((election) => (
                        <SelectItem key={election.id} value={election.id}>
                          {election.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.electionId && (
                <p className="text-sm text-destructive mt-1">{errors.electionId.message}</p>
              )}
            </div>
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
            <div className="space-y-2">
                <Label htmlFor="photo">Photo URL (Optional)</Label>
                <Input id="photo" {...register('photo')} placeholder="https://example.com/photo.jpg" />
            </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline" type="button" onClick={() => router.push('/admin/candidates')} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Saving...' : 'Save Candidate'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
