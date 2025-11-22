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
import { MoreHorizontal, PlusCircle, Edit, Trash2, Loader2 } from 'lucide-react';
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
import { db } from '@/lib/firebase';
import { ref, remove } from 'firebase/database';

type CandidateTableProps = {
  election: Election;
};

export function CandidateTable({ election }: CandidateTableProps) {
  const [filter, setFilter] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const candidates = useMemo(() => {
    if (!election || !election.candidates) return [];
    return Object.entries(election.candidates).map(([id, data]) => ({ ...data, id }))
        .sort((a, b) => (a.orderNumber || 0) - (b.orderNumber || 0));
  }, [election]);

  const filteredCandidates = candidates.filter(candidate => 
    (candidate.name.toLowerCase().includes(filter.toLowerCase()) ||
     (candidate.viceCandidateName && candidate.viceCandidateName.toLowerCase().includes(filter.toLowerCase())))
  );

  const handleAdd = () => {
    router.push(`/admin/candidates/${election.id}/new`);
  };
  
  const handleEdit = (candidateId: string) => {
    router.push(`/admin/candidates/${election.id}/edit/${candidateId}`);
  };

  const handleDelete = (candidateId: string) => {
    setSelectedCandidateId(candidateId);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!selectedCandidateId) return;
    setIsDeleting(true);
    try {
      await remove(ref(db, `elections/${election.id}/candidates/${selectedCandidateId}`));
      await remove(ref(db, `elections/${election.id}/results/${selectedCandidateId}`));
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
      setSelectedCandidateId(null);
    }
  };

  const selectedCandidate = selectedCandidateId ? candidates.find(c => c.id === selectedCandidateId) : null;
  const defaultPhoto = PlaceHolderImages.find(p => p.id === 'default-avatar');

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Input
          placeholder="Filter by name..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={handleAdd}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Candidate
        </Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">No.</TableHead>
              <TableHead className="w-[80px]">Photo</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCandidates.length > 0 ? (
                filteredCandidates.map((candidate) => (
                  <TableRow key={candidate.id}>
                    <TableCell className="font-bold text-center">{candidate.orderNumber}</TableCell>
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
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(candidate.id)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(candidate.id)}>
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
                  No candidates found for this election.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the candidate
              "{selectedCandidate?.name}" and any votes they have received.
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
