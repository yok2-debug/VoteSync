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
import type { Candidate, Election } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { saveCandidate } from '@/lib/actions';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WysiwygEditor } from '@/components/ui/wysiwyg-editor';

const candidateSchema = z.object({
  id: z.string().optional(),
  electionId: z.string().min(1, { message: 'Election must be selected.' }),
  name: z.string().min(3, { message: 'Candidate name must be at least 3 characters.' }),
  vision: z.string().optional(),
  mission: z.string().optional(),
  photo: z.string().optional(),
});

type CandidateFormData = z.infer<typeof candidateSchema>;

interface CandidateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: { candidate: Candidate, electionId: string } | null;
  onSave: () => void;
  allElections: Election[];
}

export function CandidateFormDialog({
  open,
  onOpenChange,
  initialData,
  onSave,
  allElections,
}: CandidateFormDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!initialData;

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
    if (open) {
      if (initialData) {
        reset({
            id: initialData.candidate.id,
            electionId: initialData.electionId,
            name: initialData.candidate.name,
            vision: initialData.candidate.vision || '',
            mission: initialData.candidate.mission || '',
            photo: initialData.candidate.photo || '',
        });
      } else {
        reset({ id: `new-${Date.now()}`, electionId: '', name: '', vision: '', mission: '', photo: '' });
      }
    }
  }, [initialData, reset, open]);

  const onSubmit: SubmitHandler<CandidateFormData> = async (data) => {
    setIsSubmitting(true);
    try {
      const candidateToSave = {
        id: data.id!,
        name: data.name,
        vision: data.vision,
        mission: data.mission,
        photo: data.photo,
      };

      await saveCandidate(candidateToSave, data.electionId);

      toast({
        title: `Candidate ${isEditing ? 'updated' : 'created'}`,
        description: `"${data.name}" has been successfully saved.`,
      });
      
      onSave();
      onOpenChange(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Candidate' : 'Add New Candidate'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the details for this candidate.' : 'Enter the details for the new candidate.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} id="candidate-form" className="space-y-4">
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
                <Label htmlFor="vision">Vision</Label>
                <Controller
                  name="vision"
                  control={control}
                  render={({ field }) => (
                    <WysiwygEditor
                      value={field.value || ''}
                      onChange={field.onChange}
                      placeholder="Enter the candidate's vision..."
                    />
                  )}
                />
            </div>
             <div className="space-y-2">
                <Label htmlFor="mission">Mission</Label>
                <Controller
                  name="mission"
                  control={control}
                  render={({ field }) => (
                     <WysiwygEditor
                      value={field.value || ''}
                      onChange={field.onChange}
                      placeholder="Enter the candidate's mission..."
                    />
                  )}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="photo">Photo URL (Optional)</Label>
                <Input id="photo" {...register('photo')} placeholder="https://example.com/photo.jpg" />
            </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="candidate-form" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
