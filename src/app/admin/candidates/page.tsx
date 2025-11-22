'use client';
import { useRouter } from 'next/navigation';
import { useDatabase } from '@/context/database-context';
import Loading from '@/app/loading';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreHorizontal, Edit, Trash2, Loader2, ListFilter } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { Candidate } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { db } from '@/lib/firebase';
import { ref, update } from 'firebase/database';
import { ReorderCandidatesDialog } from './components/reorder-candidates-dialog';

export default function CandidatesPage() {
  const router = useRouter();
  const { elections, isLoading } = useDatabase();
  const [filter, setFilter] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showReorderDialog, setShowReorderDialog] = useState(false);
  const [selectedCandidateInfo, setSelectedCandidateInfo] = useState<{electionId: string, candidate: Candidate} | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  
  const [electionFilter, setElectionFilter] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    elections.forEach(e => initial[e.id] = true);
    return initial;
  });

  const allCandidates = useMemo(() => {
    if (isLoading) return [];
    
    const candidatesWithElectionInfo = elections.flatMap(election => 
      election.candidates 
        ? Object.values(election.candidates).map(candidate => ({
            ...candidate,
            electionId: election.id,
            electionName: election.name,
          }))
        : []
    );

    const activeElectionFilters = Object.keys(electionFilter).filter(id => electionFilter[id]);

    const filtered = candidatesWithElectionInfo.filter(c => 
      c.name.toLowerCase().includes(filter.toLowerCase()) &&
      (activeElectionFilters.length === 0 || activeElectionFilters.includes(c.electionId))
    );

    return filtered.sort((a, b) => {
        if (a.electionName !== b.electionName) {
            return a.electionName.localeCompare(b.electionName);
        }
        const orderA = a.orderNumber ?? Infinity;
        const orderB = b.orderNumber ?? Infinity;
        return orderA - orderB;
    });

  }, [elections, isLoading, filter, electionFilter]);
  
  const handleAdd = () => {
    router.push(`/admin/candidates/new`);
  };
  
  const handleEdit = (electionId: string, candidateId: string) => {
    router.push(`/admin/candidates/edit/${electionId}/${candidateId}`);
  };

  const handleDelete = (electionId: string, candidate: Candidate) => {
    setSelectedCandidateInfo({ electionId, candidate });
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!selectedCandidateInfo) return;
    const { electionId, candidate } = selectedCandidateInfo;
    setIsDeleting(true);
    try {
      const updates: { [key: string]: null } = {};
      updates[`/elections/${electionId}/candidates/${candidate.id}`] = null;
      updates[`/elections/${electionId}/results/${candidate.id}`] = null;
      
      const election = elections.find(e => e.id === electionId);
      if (election?.votes) {
          Object.entries(election.votes).forEach(([voterId, votedCandidateId]) => {
              if (votedCandidateId === candidate.id) {
                  updates[`/elections/${electionId}/votes/${voterId}`] = null;
              }
          });
      }

      await update(ref(db), updates);

      toast({ title: 'Kandidat berhasil dihapus.' });
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Error menghapus kandidat',
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setSelectedCandidateInfo(null);
    }
  };


  const defaultPhoto = PlaceHolderImages.find(p => p.id === 'default-avatar');


  if (isLoading) {
    return <Loading />;
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manajemen Kandidat</h1>
          <p className="text-muted-foreground">
            Kelola semua kandidat yang berpartisipasi dalam semua pemilihan.
          </p>
        </div>

        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Saring berdasarkan nama kandidat..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="max-w-sm"
            />
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <ListFilter className="mr-2 h-4 w-4" />
                  Filter Pemilihan
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Tampilkan Kandidat Dari</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {elections.map((election) => (
                   <DropdownMenuCheckboxItem
                    key={election.id}
                    checked={electionFilter[election.id] || false}
                    onCheckedChange={(checked) => {
                      setElectionFilter(prev => ({...prev, [election.id]: checked}))
                    }}
                  >
                    {election.name}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
           <div className="flex gap-2">
             <Button variant="outline" onClick={() => setShowReorderDialog(true)}>
                Ubah Urutan
              </Button>
            <Button onClick={handleAdd}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Tambah Kandidat
            </Button>
           </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Foto</TableHead>
                <TableHead>Nama Kandidat</TableHead>
                <TableHead>Pemilihan</TableHead>
                <TableHead className="w-[50px]">No. Urut</TableHead>
                <TableHead className="w-[100px] text-right">Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allCandidates.length > 0 ? (
                  allCandidates.map((candidate) => (
                    <TableRow key={`${candidate.electionId}-${candidate.id}`}>
                      <TableCell>
                          <img
                            src={candidate.photo || defaultPhoto?.imageUrl || 'https://picsum.photos/seed/default/400/400'}
                            alt={`Foto ${candidate.name}`}
                            width={40}
                            height={40}
                            className="rounded-full object-cover"
                            data-ai-hint={defaultPhoto?.imageHint || 'person portrait'}
                          />
                      </TableCell>
                      <TableCell className="font-medium">
                        {candidate.name}
                        {candidate.viceCandidateName && <span className="block text-xs text-muted-foreground">{candidate.viceCandidateName}</span>}
                      </TableCell>
                      <TableCell>
                          <Badge variant="secondary">{candidate.electionName}</Badge>
                      </TableCell>
                      <TableCell className="font-bold text-center">{candidate.orderNumber}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Buka menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(candidate.electionId, candidate.id)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Ubah
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(candidate.electionId, candidate)}>
                              <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                              <span className="text-destructive">Hapus</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Tidak ada kandidat ditemukan.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
              <AlertDialogDescription>
                Tindakan ini tidak dapat dibatalkan. Ini akan menghapus kandidat secara permanen
                "{selectedCandidateInfo?.candidate.name}" dari pemilihan "{elections.find(e => e.id === selectedCandidateInfo?.electionId)?.name}" dan semua suara yang telah mereka terima.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90" disabled={isDeleting}>
                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

       <ReorderCandidatesDialog 
          open={showReorderDialog}
          onOpenChange={setShowReorderDialog}
          allElections={elections}
       />
    </>
  );
}
