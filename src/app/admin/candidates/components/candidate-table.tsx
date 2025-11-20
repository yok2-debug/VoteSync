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
import { deleteCandidate } from '@/lib/actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useRouter } from 'next/navigation';
import React from 'react';

type CandidateTableProps = {
  allElections: Election[];
};

type GroupedCandidates = {
  [electionName: string]: (Candidate & { electionName: string; electionId: string })[];
};


export function CandidateTable({ allElections }: CandidateTableProps) {
  const [filter, setFilter] = useState('');
  const [electionFilter, setElectionFilter] = useState('all');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<{ candidate: Candidate, electionId: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  
  const allCandidates = useMemo(() => {
    return allElections.flatMap(election => 
      Object.values(election.candidates || {}).map(candidate => ({
        ...candidate,
        electionName: election.name,
        electionId: election.id,
      }))
    ).sort((a, b) => (a.orderNumber || 999) - (b.orderNumber || 999));
  }, [allElections]);

  const filteredCandidates = useMemo(() => 
    allCandidates.filter(candidate => 
      (candidate.name.toLowerCase().includes(filter.toLowerCase()) ||
       (candidate.viceCandidateName && candidate.viceCandidateName.toLowerCase().includes(filter.toLowerCase()))) &&
      (electionFilter === 'all' || candidate.electionId === electionFilter)
    ), [allCandidates, filter, electionFilter]);

  const groupedCandidates = useMemo(() => {
    if (electionFilter !== 'all') {
      // If a specific election is selected, don't group, just return the filtered list under a single key.
      const election = allElections.find(e => e.id === electionFilter);
      return { [election?.name || 'Selected Election']: filteredCandidates };
    }
    // If "All Elections" is selected, group by election name.
    return filteredCandidates.reduce((acc, candidate) => {
      const { electionName } = candidate;
      if (!acc[electionName]) {
        acc[electionName] = [];
      }
      acc[electionName].push(candidate);
      return acc;
    }, {} as GroupedCandidates);
  }, [filteredCandidates, electionFilter, allElections]);

  const handleAdd = () => {
    router.push('/admin/candidates/new');
  };
  
  const handleEdit = (candidate: Candidate, electionId: string) => {
    router.push(`/admin/candidates/edit/${electionId}/${candidate.id}`);
  };

  const handleDelete = (candidate: Candidate, electionId: string) => {
    setSelectedCandidate({ candidate, electionId });
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!selectedCandidate) return;
    setIsDeleting(true);
    try {
      await deleteCandidate(selectedCandidate.candidate.id, selectedCandidate.electionId);
      toast({ title: 'Candidate deleted successfully.' });
      // The context will auto-update the UI, no need for local state management
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
            <Select value={electionFilter} onValueChange={setElectionFilter}>
                <SelectTrigger className="w-[250px]">
                    <SelectValue placeholder="Filter by election" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Elections</SelectItem>
                    {allElections.map((election) => (
                    <SelectItem key={election.id} value={election.id}>
                        {election.name}
                    </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
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
              {electionFilter === 'all' && <TableHead>Election</TableHead>}
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCandidates.length > 0 ? (
               Object.keys(groupedCandidates).map(electionName => (
                <React.Fragment key={electionName}>
                  {electionFilter === 'all' && (
                     <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableCell colSpan={5} className="font-bold text-muted-foreground">
                          {electionName}
                        </TableCell>
                      </TableRow>
                  )}
                  {groupedCandidates[electionName].map((candidate) => (
                    <TableRow key={candidate.id}>
                      <TableCell className="font-bold">{candidate.orderNumber}</TableCell>
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
                      {electionFilter === 'all' && <TableCell className="text-muted-foreground">{candidate.electionName}</TableCell>}
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(candidate, candidate.electionId)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(candidate, candidate.electionId)}>
                               <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                              <span className="text-destructive">Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No candidates found for the selected criteria.
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
              "{selectedCandidate?.candidate.name}".
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