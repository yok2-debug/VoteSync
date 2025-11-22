'use client';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEffect, useState } from 'react';
import type { Candidate, Voter, Election } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { MarkdownEditor } from '@/components/ui/markdown-editor';
import { db } from '@/lib/firebase';
import { ref, set, get, update } from 'firebase/database';
import { VoterSearchDialog } from './voter-search-dialog';
import { useDatabase } from '@/context/database-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const candidateSchema = z.object({
  id: z.string().optional(),
  electionId: z.string().min(1, { message: 'Pemilihan harus dipilih.' }),
  voterId: z.string().min(1, { message: 'Kandidat utama harus dipilih dari pemilih.' }),
  name: z.string().min(1, { message: 'Nama kandidat utama wajib diisi.' }),
  viceCandidateId: z.string().optional(),
  viceCandidateName: z.string().optional(),
  vision: z.string().optional(),
  mission: z.string().optional(),
  orderNumber: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.coerce.number({ invalid_type_error: 'Nomor urut harus berupa angka' }).positive('Nomor urut harus angka positif').optional()
  ),
  photo: z.string().optional(),
}).refine(data => !data.viceCandidateId || data.voterId !== data.viceCandidateId, {
    message: "Kandidat utama dan wakil tidak boleh orang yang sama.",
    path: ["viceCandidateId"],
});


type CandidateFormData = z.infer<typeof candidateSchema>;

interface CandidateFormProps {
  initialData: (Candidate & { voterId?: string, electionId?: string }) | null;
  allElections: Election[];
}

export function CandidateForm({
  initialData,
  allElections,
}: CandidateFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchDialog, setSearchDialog] = useState<{ open: boolean, target: 'main' | 'vice' | null }>({ open: false, target: null });
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

  const selectedElectionId = watch('electionId');

  useEffect(() => {
    if (initialData) {
      reset({
        ...initialData,
        electionId: initialData.electionId || '',
        voterId: initialData.voterId || initialData.id,
      });
    } else {
      reset({ electionId: '', name: '', voterId: '', viceCandidateName: '', viceCandidateId: '', vision: '', mission: '', orderNumber: undefined, photo: '' });
    }
  }, [initialData, reset]);

  const handleVoterSelect = (voter: Voter) => {
    if (searchDialog.target === 'main') {
        setValue('voterId', voter.id, { shouldValidate: true });
        setValue('name', voter.name, { shouldValidate: true });
    } else if (searchDialog.target === 'vice') {
        setValue('viceCandidateId', voter.id, { shouldValidate: true });
        setValue('viceCandidateName', voter.name, { shouldValidate: true });
    }
    setSearchDialog({ open: false, target: null });
  };


  const onSubmit: SubmitHandler<CandidateFormData> = async (data) => {
    setIsSubmitting(true);
    try {
      if (!data.electionId) {
        throw new Error("Pemilihan harus dipilih.");
      }

      const candidatesRef = ref(db, `elections/${data.electionId}/candidates`);
      const snapshot = await get(candidatesRef);
      const existingCandidates = snapshot.val() || {};
      
      const candidatesArray: (Candidate & { id: string })[] = Object.keys(existingCandidates).map(id => ({ ...existingCandidates[id], id }));
      
      // --- Strict Duplicate Validation ---
      const otherCandidates = isEditing ? candidatesArray.filter(c => c.id !== initialData?.id) : candidatesArray;
      const allOtherParticipantIds = new Set<string>();
      otherCandidates.forEach(c => {
        allOtherParticipantIds.add(c.id); // Add main candidate ID
        if (c.viceCandidateId) {
          allOtherParticipantIds.add(c.viceCandidateId); // Add vice candidate ID
        }
      });

      const mainCandidateVoter = voters.find(v => v.id === data.voterId);
      if (allOtherParticipantIds.has(data.voterId)) {
        throw new Error(`Pemilih "${mainCandidateVoter?.name || data.voterId}" sudah terdaftar sebagai kandidat atau wakil dalam pemilihan ini.`);
      }
      
      if (data.viceCandidateId) {
        const viceCandidateVoter = voters.find(v => v.id === data.viceCandidateId);
        if (allOtherParticipantIds.has(data.viceCandidateId)) {
           throw new Error(`Pemilih "${viceCandidateVoter?.name || data.viceCandidateId}" sudah terdaftar sebagai kandidat atau wakil dalam pemilihan ini.`);
        }
      }
      // --- End of Strict Duplicate Validation ---

      let finalOrderNumber = data.orderNumber;

      if (finalOrderNumber) {
        const isOrderNumberTaken = candidatesArray.some(
            (c: Candidate) => c.orderNumber === finalOrderNumber && c.id !== data.id
        );
        if (isOrderNumberTaken) {
            throw new Error(`Nomor urut ${finalOrderNumber} sudah digunakan dalam pemilihan ini.`);
        }
      } else {
        const maxOrderNumber = candidatesArray.reduce((max, c) => Math.max(max, c.orderNumber || 0), 0);
        finalOrderNumber = maxOrderNumber + 1;
      }

      const candidateId = data.voterId;
      
      const candidateData: Partial<Candidate> = {
        name: data.name,
        viceCandidateId: data.viceCandidateId || "",
        viceCandidateName: data.viceCandidateName || "",
        vision: data.vision,
        mission: data.mission,
        orderNumber: finalOrderNumber,
        photo: data.photo,
        id: candidateId, 
      };
      
      if (isEditing && initialData?.electionId && initialData.electionId !== data.electionId) {
          // Remove from old election
          await set(ref(db, `elections/${initialData.electionId}/candidates/${initialData.id}`), null);
          // Add to new election
          await set(ref(db, `elections/${data.electionId}/candidates/${candidateId}`), candidateData);
      } else if (isEditing && initialData?.id) {
          if (initialData.id !== candidateId) {
             // If the main candidate ID changes, remove the old one and add the new one
             await set(ref(db, `elections/${data.electionId}/candidates/${initialData.id}`), null);
             await set(ref(db, `elections/${data.electionId}/candidates/${candidateId}`), candidateData);
          } else {
            // Standard update
            await update(ref(db, `elections/${data.electionId}/candidates/${candidateId}`), candidateData);
          }
      } else {
        // This is a new candidate, just set the data. The duplicate check is already done above.
        await set(ref(db, `elections/${data.electionId}/candidates/${candidateId}`), candidateData);
      }

      toast({
        title: `Kandidat ${isEditing ? 'diperbarui' : 'dibuat'}`,
        description: `"${data.name}" telah berhasil disimpan.`,
      });
      
      router.push(`/admin/candidates`);
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
            <div className="space-y-2 col-span-full">
                <Label htmlFor="electionId">Pemilihan</Label>
                 <Controller
                    control={control}
                    name="electionId"
                    render={({ field }) => (
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih pemilihan untuk kandidat..." />
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
                  {errors.electionId && <p className="text-sm text-destructive mt-1">{errors.electionId.message}</p>}
            </div>

            <div className="space-y-2 col-span-1">
              <Label htmlFor="name">Nama Kandidat Utama</Label>
              <div className="flex gap-2">
                <Input
                  id="name"
                  {...register('name')}
                  readOnly
                  placeholder="Pilih pemilih..."
                  disabled={!selectedElectionId}
                />
                <Button type="button" variant="outline" onClick={() => setSearchDialog({ open: true, target: 'main' })} disabled={!selectedElectionId}>
                  <Search className="mr-2 h-4 w-4" />
                  Cari
                </Button>
              </div>
              {errors.voterId && (
                <p className="text-sm text-destructive mt-1">{errors.voterId.message}</p>
              )}
               {errors.name && (
                <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2 col-span-1">
              <Label htmlFor="viceCandidateName">Nama Calon Wakil (Opsional)</Label>
               <div className="flex gap-2">
                <Input
                  id="viceCandidateName"
                  {...register('viceCandidateName')}
                  readOnly
                  placeholder="Pilih pemilih..."
                   disabled={!selectedElectionId}
                />
                <Button type="button" variant="outline" onClick={() => setSearchDialog({ open: true, target: 'vice' })} disabled={!selectedElectionId}>
                  <Search className="mr-2 h-4 w-4" />
                  Cari
                </Button>
              </div>
               {errors.viceCandidateId && (
                <p className="text-sm text-destructive mt-1">{errors.viceCandidateId.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="orderNumber">Nomor Urut (Opsional)</Label>
              <Input id="orderNumber" type="number" {...register('orderNumber')} disabled={!selectedElectionId} placeholder="Otomatis jika kosong" />
              {errors.orderNumber && (
                <p className="text-sm text-destructive mt-1">{errors.orderNumber.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="photo">URL Foto (Opsional)</Label>
              <Input id="photo" {...register('photo')} placeholder="https://example.com/photo.jpg" disabled={!selectedElectionId} />
            </div>
             <div className="space-y-2 col-span-full">
                <Label htmlFor="vision">Visi</Label>
                <Controller
                  name="vision"
                  control={control}
                  render={({ field }) => <MarkdownEditor {...field} />}
                />
              </div>
              <div className="space-y-2 col-span-full">
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
            <Button variant="outline" type="button" onClick={() => router.push(`/admin/candidates`)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Menyimpan...' : 'Simpan Kandidat'}
            </Button>
        </div>
      </form>

      <VoterSearchDialog
        open={searchDialog.open}
        onOpenChange={(isOpen) => setSearchDialog({ open: isOpen, target: null })}
        onVoterSelect={handleVoterSelect}
        voters={voters}
        categories={categories}
      />
    </>
  );
}
