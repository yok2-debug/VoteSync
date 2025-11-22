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
import { useForm, SubmitHandler, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEffect, useState } from 'react';
import type { Candidate, Election } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { MarkdownEditor } from '@/components/ui/markdown-editor';
import { db } from '@/lib/firebase';
import { ref, set, get, push, update, remove } from 'firebase/database';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

const participatedElectionSchema = z.object({
  electionId: z.string(),
  orderNumber: z.coerce.number().min(1, 'Order number is required'),
});

const candidateSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, { message: 'Candidate name must be at least 3 characters.' }),
  viceCandidateName: z.string().optional(),
  vision: z.string().optional(),
  mission: z.string().optional(),
  photo: z.string().optional(),
  participatedElections: z.array(participatedElectionSchema).min(1, 'Candidate must participate in at least one election.'),
});

type CandidateFormData = z.infer<typeof candidateSchema>;

interface CandidateFormProps {
  initialData: (Partial<Candidate> & { participatedElections?: { electionId: string, orderNumber: number }[] }) | null;
  allElections: Election[];
}

export function CandidateForm({
  initialData,
  allElections,
}: CandidateFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!initialData?.id;

  const form = useForm<CandidateFormData>({
    resolver: zodResolver(candidateSchema),
  });

  const { fields, append, remove, update: updateField } = useFieldArray({
    control: form.control,
    name: "participatedElections"
  });

  const selectedElectionIds = form.watch('participatedElections', []).map(p => p.electionId);

  useEffect(() => {
    if (initialData) {
      form.reset({
          id: initialData.id,
          name: initialData.name || '',
          viceCandidateName: initialData.viceCandidateName || '',
          vision: initialData.vision || '',
          mission: initialData.mission || '',
          photo: initialData.photo || '',
          participatedElections: initialData.participatedElections || [],
      });
    } else {
      form.reset({ id: `new-${Date.now()}`, name: '', viceCandidateName: '', vision: '', mission: '', photo: '', participatedElections: [] });
    }
  }, [initialData, form]);

  const onSubmit: SubmitHandler<CandidateFormData> = async (data) => {
    setIsSubmitting(true);
    try {
      let candidateId = data.id;
      const isNew = !isEditing;
  
      if (isNew) {
        // Generate a single ID for the new candidate
        candidateId = push(ref(db, `elections/${data.participatedElections[0].electionId}/candidates`)).key!;
      }
      
      const candidateDataToSave = {
        name: data.name,
        viceCandidateName: data.viceCandidateName,
        vision: data.vision,
        mission: data.mission,
        photo: data.photo,
      };

      const dbUpdates: { [key: string]: any } = {};

      // First, handle updates and additions
      for (const participated of data.participatedElections) {
        const { electionId, orderNumber } = participated;
        const electionCandidatesRef = ref(db, `elections/${electionId}/candidates`);
        const electionSnapshot = await get(electionCandidatesRef);
        const candidates = electionSnapshot.val() || {};

        const isOrderNumberTaken = Object.entries(candidates).some(
          ([key, c]: [string, any]) => c.orderNumber === orderNumber && key !== candidateId
        );
        if (isOrderNumberTaken) {
          const electionName = allElections.find(e => e.id === electionId)?.name || electionId;
          throw new Error(`Order number ${orderNumber} is already taken in election "${electionName}".`);
        }
        
        dbUpdates[`/elections/${electionId}/candidates/${candidateId}`] = { ...candidateDataToSave, orderNumber };
      }

      // If editing, we need to handle removals from elections
      if (isEditing && initialData?.participatedElections) {
        const initialElectionIds = new Set(initialData.participatedElections.map(p => p.electionId));
        const currentElectionIds = new Set(data.participatedElections.map(p => p.electionId));

        for (const electionId of initialElectionIds) {
          if (!currentElectionIds.has(electionId)) {
            // This candidate was removed from this election
            dbUpdates[`/elections/${electionId}/candidates/${candidateId}`] = null;
            dbUpdates[`/elections/${electionId}/results/${candidateId}`] = null;
          }
        }
      }

      await update(ref(db), dbUpdates);

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
  
  const handleElectionCheck = (checked: boolean | string, electionId: string) => {
    const index = fields.findIndex(field => field.electionId === electionId);
    if (checked) {
      if (index === -1) {
        append({ electionId, orderNumber: 1 });
      }
    } else {
      if (index !== -1) {
        remove(index);
      }
    }
  };

  return (
    <Form {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card>
          <CardHeader>
              <CardTitle>{isEditing ? 'Edit Candidate' : 'Add New Candidate'}</CardTitle>
              <CardDescription>
                  {isEditing ? 'Update the details for this candidate.' : 'Enter the details for the new candidate.'}
              </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Candidate Name</Label>
                <Input id="name" {...form.register('name')} />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>
                )}
              </div>
               <div className="space-y-2">
                <Label htmlFor="viceCandidateName">Vice Candidate Name (Optional)</Label>
                <Input id="viceCandidateName" {...form.register('viceCandidateName')} />
              </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="photo">Photo URL (Optional)</Label>
                <Input id="photo" {...form.register('photo')} placeholder="https://example.com/photo.jpg" />
            </div>
        </CardContent>
      </Card>
      
       <Card>
        <CardHeader>
            <CardTitle>Election Participation</CardTitle>
            <CardDescription>Select the elections this candidate will participate in and set their order number for each.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormItem>
                   <FormLabel className="text-base">Select Elections</FormLabel>
                     <ScrollArea className="h-48 w-full rounded-md border p-4">
                      {allElections.length > 0 ? allElections.map((item) => (
                          <FormItem
                            key={item.id}
                            className="flex flex-row items-start space-x-3 space-y-0 mb-3"
                          >
                            <FormControl>
                              <Checkbox
                                checked={selectedElectionIds.includes(item.id)}
                                onCheckedChange={(checked) => handleElectionCheck(checked, item.id)}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {item.name}
                            </FormLabel>
                          </FormItem>
                      )) : <p className="text-sm text-muted-foreground">No elections available.</p>}
                    </ScrollArea>
                </FormItem>
                <div className="space-y-4">
                   <FormLabel className="text-base">Set Order Numbers</FormLabel>
                    <ScrollArea className="h-48 w-full rounded-md border p-4">
                    {fields.length > 0 ? fields.map((field, index) => {
                      const electionName = allElections.find(e => e.id === field.electionId)?.name;
                      return (
                        <div key={field.id} className="flex items-center gap-3 mb-2">
                          <Label htmlFor={`participatedElections.${index}.orderNumber`} className="flex-1 text-sm text-muted-foreground">{electionName}</Label>
                           <Input
                              id={`participatedElections.${index}.orderNumber`}
                              type="number"
                              {...form.register(`participatedElections.${index}.orderNumber`)}
                              className="w-24"
                              placeholder="No."
                            />
                        </div>
                      )
                    }) : (
                        <p className="text-center text-sm text-muted-foreground p-4">Select an election to set the order number.</p>
                    )}
                   </ScrollArea>
                </div>
            </div>
             {form.formState.errors.participatedElections && (
                <p className="text-sm text-destructive mt-2">{form.formState.errors.participatedElections.message || form.formState.errors.participatedElections.root?.message}</p>
              )}
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
                control={form.control}
                render={({ field }) => <MarkdownEditor {...field} />}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mission">Mission</Label>
              <Controller
                name="mission"
                control={form.control}
                render={({ field }) => <MarkdownEditor {...field} />}
              />
            </div>
        </CardContent>
      </Card>


      <div className="flex justify-end gap-2">
          <Button variant="outline" type="button" onClick={() => router.push('/admin/candidates')} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Saving...' : 'Save Candidate'}
          </Button>
      </div>
    </form>
    </Form>
  );
}
