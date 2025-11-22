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
import { ref, set, get, update } from 'firebase/database';
import { VoterSearchDialog } from './voter-search-dialog';
import { useDatabase } from '@/context/database-context';

const candidateSchema = z.object({
  id: z.string().optional(),
  voterId: z.string().min(1, { message: 'Kandidat utama harus dipilih dari pemilih.' }),
  name: z.string().min(1, { message: 'Nama kandidat utama wajib diisi.' }),
  viceCandidateId: z.string().optional(),
  viceCandidateName: z.string().optional(),
  vision: z.string().optional(),
  mission: z.string().optional(),
  orderNumber: z.coerce.number().min(1, 'Nomor urut wajib diisi'),
  photo: z.string().optional(),
}).refine(data => data.voterId !== data.viceCandidateId || !data.viceCandidateId, {
    message: "Kandidat utama dan wakil tidak boleh orang yang sama.",
    path: ["viceCandidateId"],
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

  const selectedVoterId = watch('voterId');

  useEffect(() => {
    if (initialData) {
      reset({
        ...initialData,
        voterId: initialData.voterId || initialData.id,
      });
    } else {
      reset({ name: '', voterId: '', viceCandidateName: '', viceCandidateId: '', vision: '', mission: '', orderNumber: 1, photo: '' });
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
      const candidatesRef = ref(db, `elections/${electionId}/candidates`);
      const snapshot = await get(candidatesRef);
      const existingCandidates = snapshot.val() || {};

      const isOrderNumberTaken = Object.entries(existingCandidates).some(
        ([key, c]: [string, any]) => c.orderNumber === data.orderNumber && key !== data.id
      );

      if (isOrderNumberTaken) {
        throw new Error(`Nomor urut ${data.orderNumber} sudah digunakan dalam pemilihan ini.`);
      }

      // ID kandidat adalah ID pemilih utama
      const candidateId = data.voterId;

      const candidateData: Partial<Candidate> = {
        name: data.name,
        viceCandidateId: data.viceCandidateId,
        viceCandidateName: data.viceCandidateName,
        vision: data.vision,
        mission: data.mission,
        orderNumber: data.orderNumber,
        photo: data.photo,
        id: candidateId, 
      };

      if (isEditing && initialData?.id) {
          if (initialData.id !== candidateId) {
             // Jika ID berubah, ini kompleks. Anggap saja seperti membuat baru dan menghapus yang lama.
             // Untuk saat ini, kita akan memperbarui di bawah ID baru dan menghapus yang lama.
             await set(ref(db, `elections/${electionId}/candidates/${candidateId}`), candidateData);
             await set(ref(db, `elections/${electionId}/candidates/${initialData.id}`), null);
          } else {
            await update(ref(db, `elections/${electionId}/candidates/${candidateId}`), candidateData);
          }
      } else {
        // Mencegah penambahan pemilih yang sama sebagai kandidat dua kali
        if (existingCandidates[candidateId]) {
            throw new Error(`Pemilih "${data.name}" sudah menjadi kandidat dalam pemilihan ini.`);
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
            <div className="space-y-2 col-span-1">
              <Label htmlFor="name">Nama Kandidat Utama</Label>
              <div className="flex gap-2">
                <Input
                  id="name"
                  {...register('name')}
                  readOnly
                  placeholder="Pilih pemilih..."
                />
                <Button type="button" variant="outline" onClick={() => setSearchDialog({ open: true, target: 'main' })}>
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
                />
                <Button type="button" variant="outline" onClick={() => setSearchDialog({ open: true, target: 'vice' })}>
                  <Search className="mr-2 h-4 w-4" />
                  Cari
                </Button>
              </div>
               {errors.viceCandidateId && (
                <p className="text-sm text-destructive mt-1">{errors.viceCandidateId.message}</p>
              )}
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
        open={searchDialog.open}
        onOpenChange={(isOpen) => setSearchDialog({ open: isOpen, target: null })}
        onVoterSelect={handleVoterSelect}
        voters={voters}
        categories={categories}
      />
    </>
  );
}
