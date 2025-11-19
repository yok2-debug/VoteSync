'use client';
import { useForm, useFieldArray, SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Election, Candidate } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2, PlusCircle, Loader2 } from 'lucide-react';
import { saveElection } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const candidateSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Candidate name is required.'),
  vision: z.string().optional(),
  mission: z.string().optional(),
  photo: z.string().optional(),
});

const electionSchema = z.object({
  id: z.string(),
  name: z.string().min(3, 'Election name must be at least 3 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  status: z.enum(['pending', 'ongoing', 'completed']),
  candidates: z.array(candidateSchema).min(2, 'At least two candidates are required.'),
});

type ElectionFormData = z.infer<typeof electionSchema>;

interface ElectionFormProps {
  election: Election;
}

export function ElectionForm({ election }: ElectionFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ElectionFormData>({
    resolver: zodResolver(electionSchema),
    defaultValues: {
      ...election,
      candidates: election.candidates ? Object.values(election.candidates) : [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'candidates',
  });

  const onSubmit = async (data: ElectionFormData) => {
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('id', data.id);
    formData.append('name', data.name);
    formData.append('description', data.description);
    formData.append('status', data.status);
    formData.append('candidates', JSON.stringify(data.candidates));

    try {
      await saveElection(formData);
      toast({
        title: `Election ${data.id === 'new' ? 'created' : 'updated'}`,
        description: `The election "${data.name}" has been saved successfully.`,
      });
      router.push('/admin/elections');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error saving election',
        description: error instanceof Error ? error.message : 'An unknown error occurred.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Election Details</CardTitle>
          <CardDescription>Provide basic information about the election.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Election Name</Label>
            <Input id="name" {...form.register('name')} />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...form.register('description')} />
            {form.formState.errors.description && (
              <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Controller
                control={form.control}
                name="status"
                render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="ongoing">Ongoing</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                    </Select>
                )}
            />
            {form.formState.errors.status && (
              <p className="text-sm text-destructive">{form.formState.errors.status.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Candidates</CardTitle>
          <CardDescription>Manage the candidates for this election.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {fields.map((field, index) => (
            <div key={field.id} className="p-4 border rounded-lg relative space-y-4">
               <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 text-destructive hover:bg-destructive/10"
                onClick={() => remove(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <div className="space-y-2">
                <Label htmlFor={`candidates.${index}.name`}>Candidate Name</Label>
                <Input
                  id={`candidates.${index}.name`}
                  {...form.register(`candidates.${index}.name` as const)}
                />
                 {form.formState.errors.candidates?.[index]?.name && (
                    <p className="text-sm text-destructive">{form.formState.errors.candidates?.[index]?.name?.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor={`candidates.${index}.vision`}>Vision</Label>
                <Textarea
                  id={`candidates.${index}.vision`}
                  {...form.register(`candidates.${index}.vision` as const)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`candidates.${index}.mission`}>Mission</Label>
                <Textarea
                  id={`candidates.${index}.mission`}
                  {...form.register(`candidates.${index}.mission` as const)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`candidates.${index}.photo`}>Photo URL (Optional)</Label>
                <Input
                  id={`candidates.${index}.photo`}
                  {...form.register(`candidates.${index}.photo` as const)}
                  placeholder="https://example.com/photo.jpg"
                />
              </div>
            </div>
          ))}
          {form.formState.errors.candidates?.root && (
            <p className="text-sm text-destructive">{form.formState.errors.candidates.root.message}</p>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => append({ id: `temp-${Date.now()}`, name: '', vision: '', mission: '', photo: '' })}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Candidate
          </Button>
        </CardContent>
      </Card>
      
      <div className="flex justify-end gap-2">
         <Button type="button" variant="outline" onClick={() => router.push('/admin/elections')} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? 'Saving...' : 'Save Election'}
        </Button>
      </div>
    </form>
  );
}
