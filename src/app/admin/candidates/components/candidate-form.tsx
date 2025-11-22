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
import type { Candidate, Voter } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { MarkdownEditor } from '@/components/ui/markdown-editor';
import { db } from '@/lib/firebase';
import { ref, set, get, push, update } from 'firebase/database';
import { VoterSearchDialog } from './voter-search-dialog';
import { useDatabase } from '@/context/database-context';

const candidateSchema = z.object({
  id: z.string().optional(),
  voterId: z.string().min(1, { message: 'Candidate must be selected from a voter.' }),
  name: z.string().min(1, { message: 'Candidate name is required.' }),
  viceCandidateName: z.string().optional(),
  vision: z.string().optional(),
  mission: z.string().optional(),
  orderNumber: z.coerce.number().min(1, 'Order number is required'),
  photo: z.string().optional(),
});

type CandidateFormData = z.infer<typeof candidateSchema>;

interface CandidateFormProps {
  initialData: (Candidate & { voterId?: string }) | null;
  electionId: string;
}

export function CandidateForm({
  initialData,
  electionId,
}: CandidateFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const { voters, categories } = useDatabase();
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CandidateFormData>({
    resolver: zodResolver(candidateSchema),
  });

  const selectedVoterId = watch('voterId');

  useEffect(() => {
    if (initialData) {
      reset({
        ...initialData,
        voterId: initialData.voterId || initialData.id,
      });
    } else {
      reset({ name: '', voterId: '', viceCandidateName: '', vision: '', mission: '', orderNumber: 1, photo: '' });
    }
  }, [initialData, reset]);

  const handleVoterSelect = (voter: Voter) => {
    setValue('voterId', voter.id, { shouldValidate: true });
    setValue('name', voter.name, { shouldValidate: true });
    setIsSearchDialogOpen(false);
  };


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

      // In the new model, candidate ID is the voter ID.
      const candidateId = data.voterId;

      const candidateData = {
        name: data.name,
        viceCandidateName: data.viceCandidateName,
        vision: data.vision,
        mission: data.mission,
        orderNumber: data.orderNumber,
        photo: data.photo,
        id: candidateId, // Ensure ID is consistent
      };

      if (isEditing && initialData?.id) {
          if (initialData.id !== candidateId) {
             // ID has changed, this is complex. Let's treat it as creating a new one and deleting the old one.
             // For simplicity now, we can just update under the new ID.
             // A more robust solution might involve deleting the old record.
             await set(ref(db, `elections/${electionId}/candidates/${candidateId}`), candidateData);
             // Optionally remove the old one if it's not the same as new id
             if(initialData.id !== candidateId) {
                await set(ref(db, `elections/${electionId}/candidates/${initialData.id}`), null);
             }
          } else {
            await update(ref(db, `elections/${electionId}/candidates/${candidateId}`), candidateData);
          }
      } else {
        // Prevent adding the same voter as a candidate twice in the same election
        if (existingCandidates[candidateId]) {
            throw new Error(`Voter "${data.name}" is already a candidate in this election.`);
        }
        await set(ref(db, `elections/${electionId}/candidates/${candidateId}`), candidateData);
      }

      toast({
        title: `Kandidat ${isEditing ? 'diperbarui' : 'dibuat'}`,
        description: `"${data.name}" telah berhasil disimpan.`,
      });
      
      router.push(`/admin/candidates?electionId=${electionId}`);
      router.refresh();

    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error menyimpan kandidat',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan tidak diketahui.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 col-span-1 md:col-span-2">
              <Label htmlFor="name">Nama Kandidat (dipilih dari pemilih)</Label>
              <div className="flex gap-2">
                <Input
                  id="name"
                  {...register('name')}
                  readOnly
                  placeholder="Pilih pemilih untuk menjadi kandidat..."
                />
                <Button type="button" variant="outline" onClick={() => setIsSearchDialogOpen(true)}>
                  <Search className="mr-2 h-4 w-4" />
                  Cari Pemilih
                </Button>
              </div>
              {errors.voterId && (
                <p className="text-sm text-destructive mt-1">{errors.voterId.message}</p>
              )}
               {errors.name && (
                <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="viceCandidateName">Nama Calon Wakil (Opsional)</Label>
              <Input id="viceCandidateName" {...register('viceCandidateName')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="orderNumber">Nomor Urut</Label>
              <Input id="orderNumber" type="number" {...register('orderNumber')} />
              {errors.orderNumber && (
                <p className="text-sm text-destructive mt-1">{errors.orderNumber.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="photo">URL Foto (Opsional)</Label>
              <Input id="photo" {...register('photo')} placeholder="https://example.com/photo.jpg" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Visi & Misi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="vision">Visi</Label>
                <Controller
                  name="vision"
                  control={control}
                  render={({ field }) => <MarkdownEditor {...field} />}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mission">Misi</Label>
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
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Menyimpan...' : 'Simpan Kandidat'}
            </Button>
        </div>
      </form>

      <VoterSearchDialog
        open={isSearchDialogOpen}
        onOpenChange={setIsSearchDialogOpen}
        onVoterSelect={handleVoterSelect}
        voters={voters}
        categories={categories}
      />
    </>
  );
}
