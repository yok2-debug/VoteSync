'use client';
import { useState, useMemo } from 'react';
import type { Election, Candidate } from '@/lib/types';
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
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, PlusCircle, Edit, Trash2, Loader2, ArrowUpDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
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
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useRouter } from 'next/navigation';
import React from 'react';
import { ReorderCandidatesDialog } from './reorder-candidates-dialog';
import { db } from '@/lib/firebase';
import { ref, get, update } from 'firebase/database';
import { Badge } from '@/components/ui/badge';

type CandidateTableProps = {
  allElections: Election[];
};

type EnrichedCandidate = Candidate & {
  participatedIn: { electionId: string; electionName: string; orderNumber?: number }[];
};

export function CandidateTable({ allElections }: CandidateTableProps) {
  const [filter, setFilter] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showReorderDialog, setShowReorderDialog] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<EnrichedCandidate | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const allCandidates = useMemo(() => {
    const candidatesMap = new Map<string, EnrichedCandidate>();

    for (const election of allElections) {
      if (!election.candidates) continue;

      for (const candidateId in election.candidates) {
        const candidateData = election.candidates[candidateId];
        const participationInfo = {
          electionId: election.id,
          electionName: election.name,
          orderNumber: candidateData.orderNumber
        };

        if (candidatesMap.has(candidateId)) {
          // Add election to existing candidate
          const existing = candidatesMap.get(candidateId)!;
          existing.participatedIn.push(participationInfo);
        } else {
          // Create new candidate entry
          candidatesMap.set(candidateId, {
            id: candidateId,
            name: candidateData.name,
            viceCandidateName: candidateData.viceCandidateName,
            photo: candidateData.photo,
            vision: candidateData.vision,
            mission: candidateData.mission,
            participatedIn: [participationInfo],
          });
        }
      }
    }
    return Array.from(candidatesMap.values());
  }, [allElections]);

  const filteredCandidates = useMemo(() => 
    allCandidates.filter(candidate => 
      (candidate.name.toLowerCase().includes(filter.toLowerCase()) ||
       (candidate.viceCandidateName && candidate.viceCandidateName.toLowerCase().includes(filter.toLowerCase())))
    ), [allCandidates, filter]);

  const handleAdd = () => {
    router.push('/admin/candidates/new');
  };
  
  const handleEdit = (candidate: EnrichedCandidate) => {
    router.push(`/admin/candidates/edit/${candidate.id}`);
  };

  const handleDelete = (candidate: EnrichedCandidate) => {
    setSelectedCandidate(candidate);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!selectedCandidate) return;
    setIsDeleting(true);
    try {
        let hasVotes = false;
        for (const p of selectedCandidate.participatedIn) {
            const electionVotesRef = ref(db, `elections/${p.electionId}/votes`);
            const votesSnapshot = await get(electionVotesRef);
            if (votesSnapshot.exists()) {
                const votes = votesSnapshot.val();
                if (Object.values(votes).some(vote => vote === selectedCandidate.id)) {
                    hasVotes = true;
                    break;
                }
            }
        }
        
        if (hasVotes) {
          throw new Error("Cannot delete candidate. They have already received votes in at least one election.");
        }
        
        const updates: { [key: string]: null } = {};
        for (const p of selectedCandidate.participatedIn) {
            updates[`/elections/${p.electionId}/candidates/${selectedCandidate.id}`] = null;
            updates[`/elections/${p.electionId}/results/${selectedCandidate.id}`] = null;
        }

        await update(ref(db), updates);

        toast({ title: 'Candidate deleted successfully.' });
      // The context will auto-update the UI
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Error deleting candidate',
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setSelectedCandidate(null);
    }
  };

  const defaultPhoto = PlaceHolderImages.find(p => p.id === 'default-avatar');

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-2 flex-wrap">
        <div className="flex gap-2">
            <Input
              placeholder="Filter by name..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="max-w-sm"
            />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowReorderDialog(true)}>
              <ArrowUpDown className="mr-2 h-4 w-4" />
              Ubah Urutan
          </Button>
          <Button onClick={handleAdd}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Candidate
          </Button>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Photo</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Participated In</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCandidates.length > 0 ? (
                filteredCandidates.map((candidate) => (
                  <TableRow key={candidate.id}>
                    <TableCell>
                        <img
                          src={candidate.photo || defaultPhoto?.imageUrl || 'https://picsum.photos/seed/default/400/400'}
                          alt={`Photo of ${candidate.name}`}
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
                        <div className="flex flex-wrap gap-1">
                          {candidate.participatedIn.sort((a,b) => a.electionName.localeCompare(b.electionName)).map(p => (
                              <Badge key={p.electionId} variant="secondary" className="font-normal">
                                  {p.electionName} (No. {p.orderNumber})
                              </Badge>
                          ))}
                        </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(candidate)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(candidate)}>
                             <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                            <span className="text-destructive">Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No candidates found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ReorderCandidatesDialog
        open={showReorderDialog}
        onOpenChange={setShowReorderDialog}
        allElections={allElections}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the candidate
              "{selectedCandidate?.name}" from all elections they are participating in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90" disabled={isDeleting}>
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
