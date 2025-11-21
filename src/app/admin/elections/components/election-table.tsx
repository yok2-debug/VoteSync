'use client';
import { useState } from 'react';
import type { Election } from '@/lib/types';
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
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
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
import { format } from 'date-fns';
import { db } from '@/lib/firebase';
import { ref, remove } from 'firebase/database';

type ElectionTableProps = {
  initialElections: Election[];
};

export function ElectionTable({ initialElections }: ElectionTableProps) {
  const [elections, setElections] = useState<Election[]>(initialElections);
  const [filter, setFilter] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedElection, setSelectedElection] = useState<Election | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const filteredElections = elections.filter((election) =>
    election.name.toLowerCase().includes(filter.toLowerCase())
  );

  const getStatusBadge = (election: Election) => {
    const now = new Date();
    const startDate = election.startDate ? new Date(election.startDate) : null;
    const endDate = election.endDate ? new Date(election.endDate) : null;

    if (endDate && now > endDate) {
      return <Badge variant="destructive">Berakhir</Badge>;
    }
    if (startDate && now >= startDate && endDate && now < endDate) {
      return <Badge className="bg-green-500 text-white">Berlangsung</Badge>;
    }
    if (startDate && now < startDate) {
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Belum Mulai</Badge>;
    }

    // Fallback to original status if schedule is not set or doesn't fit conditions
    switch (election.status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'active':
        return <Badge className="bg-yellow-400 text-black">Active (No Schedule)</Badge>;
      default:
        return <Badge>{election.status}</Badge>;
    }
  };
  
  const handleAdd = () => {
    router.push('/admin/elections/new');
  };

  const handleEdit = (election: Election) => {
    router.push(`/admin/elections/${election.id}`);
  };

  const handleDelete = (election: Election) => {
    setSelectedElection(election);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!selectedElection) return;
    setIsDeleting(true);
    try {
      await remove(ref(db, `elections/${selectedElection.id}`));
      setElections(elections.filter((e) => e.id !== selectedElection.id));
      toast({ title: 'Election deleted successfully.' });
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Error deleting election',
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setSelectedElection(null);
    }
  };

  const formatSchedule = (start?: string, end?: string) => {
    if (!start || !end) return 'Not set';
    const startDate = new Date(start);
    const endDate = new Date(end);
    const startFormat = format(startDate, 'd MMM yyyy, HH:mm');
    const endFormat = format(endDate, 'd MMM yyyy, HH:mm');
    return `${startFormat} - ${endFormat}`;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Input
          placeholder="Filter elections..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={handleAdd}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Election
        </Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Schedule</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Candidates</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredElections.length > 0 ? (
              filteredElections.map((election) => (
                <TableRow key={election.id}>
                  <TableCell className="font-medium">{election.name}</TableCell>
                  <TableCell>
                    {formatSchedule(election.startDate, election.endDate)}
                  </TableCell>
                  <TableCell>{getStatusBadge(election)}</TableCell>
                  <TableCell>{election.candidates ? Object.keys(election.candidates).length : 0}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(election)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(election)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No elections found.
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
              This action cannot be undone. This will permanently delete the election
              "{selectedElection?.name}" and all of its associated data.
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
