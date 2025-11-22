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
  DropdownMenuSeparator,
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
import { ref, remove, update, get } from 'firebase/database';

type ElectionTableProps = {
  elections: Election[];
};

export function ElectionTable({ elections }: ElectionTableProps) {
  const [filter, setFilter] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedElection, setSelectedElection] = useState<Election | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const filteredElections = elections.filter((election) =>
    election.name.toLowerCase().includes(filter.toLowerCase())
  );

  const getScheduleStatusBadge = (election: Election) => {
    const now = new Date();
    const startDate = election.startDate ? new Date(election.startDate) : null;
    const endDate = election.endDate ? new Date(election.endDate) : null;

    if (endDate && now > endDate) {
      return <Badge variant="destructive">Berakhir</Badge>;
    }
    if (startDate && now >= startDate && endDate && now < endDate) {
      return <Badge className="bg-green-500 text-white hover:bg-green-500/90">Berlangsung</Badge>;
    }
    if (startDate && now < startDate) {
      return <Badge className="bg-blue-500 text-white hover:bg-blue-500/90">Belum Mulai</Badge>;
    }
    return <Badge variant="secondary">Jadwal Tidak Diatur</Badge>;
  };

  const getDbStatusBadge = (election: Election) => {
    switch (election.status) {
        case 'pending':
          return <Badge variant="secondary">Pending</Badge>;
        case 'active':
          return <Badge className="bg-yellow-400 text-black hover:bg-yellow-400/90">Aktif</Badge>;
        default:
          return <Badge>{election.status}</Badge>;
      }
  }
  
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
      // First, clean up category references
      const categoriesRef = ref(db, 'categories');
      const categoriesSnapshot = await get(categoriesRef);
      if (categoriesSnapshot.exists()) {
        const updates: { [key: string]: any } = {};
        categoriesSnapshot.forEach(category => {
          const catData = category.val();
          if (catData.allowedElections && Array.isArray(catData.allowedElections)) {
            const newAllowedElections = catData.allowedElections.filter(
              (id: string) => id !== selectedElection.id
            );
            if (newAllowedElections.length !== catData.allowedElections.length) {
              updates[`/categories/${category.key}/allowedElections`] = newAllowedElections;
            }
          }
        });
        if (Object.keys(updates).length > 0) {
          await update(ref(db), updates);
        }
      }

      // Then, delete the election itself
      await remove(ref(db, `elections/${selectedElection.id}`));
      toast({ title: 'Pemilihan berhasil dihapus.' });
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Error menghapus pemilihan',
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setSelectedElection(null);
    }
  };

  const formatSchedule = (start?: string, end?: string) => {
    if (!start || !end) return 'Tidak diatur';
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
          placeholder="Saring pemilihan..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={handleAdd}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Tambah Pemilihan
        </Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Jadwal</TableHead>
              <TableHead>Status DB</TableHead>
              <TableHead>Status Jadwal</TableHead>
              <TableHead>Kandidat</TableHead>
              <TableHead className="w-[100px] text-right">Tindakan</TableHead>
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
                  <TableCell>{getDbStatusBadge(election)}</TableCell>
                  <TableCell>{getScheduleStatusBadge(election)}</TableCell>
                  <TableCell>{election.candidates ? Object.keys(election.candidates).length : 0}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Buka menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(election)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Ubah
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-100 dark:focus:bg-red-900/40" onClick={() => handleDelete(election)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Tidak ada pemilihan ditemukan.
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
              Tindakan ini tidak dapat dibatalkan. Ini akan menghapus pemilihan secara permanen
              "{selectedElection?.name}" dan semua data terkaitnya.
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
  );
}
