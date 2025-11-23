'use client';
import { useState, useRef, useMemo, useEffect } from 'react';
import type { Voter, Category, Election } from '@/lib/types';
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
import { MoreHorizontal, PlusCircle, Download, Upload, Edit, Trash2, Loader2, KeyRound, Printer } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { VoterFormDialog } from './voter-form-dialog';
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
import { ResetPasswordDialog } from './reset-password-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Papa from 'papaparse';
import { VoterImportDialog } from './voter-import-dialog';
import { db } from '@/lib/firebase';
import { ref, update, set, runTransaction } from 'firebase/database';
import { useDatabase } from '@/context/database-context';
import { Checkbox } from '@/components/ui/checkbox';
import { BulkUpdateCategoryDialog } from './bulk-update-category-dialog';
import { useReactToPrint } from 'react-to-print';
import { PrintLayout } from '../print/components/print-layout';

type VoterTableProps = {
  voters: Voter[];
  categories: Category[];
};

const ITEMS_PER_PAGE = 100;


export function VoterTable({ voters, categories }: VoterTableProps) {
  const { elections } = useDatabase();
  const [filter, setFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showBulkUpdateDialog, setShowBulkUpdateDialog] = useState(false);
  const [importedData, setImportedData] = useState<any[]>([]);
  const [selectedVoter, setSelectedVoter] = useState<Voter | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const printComponentRef = useRef(null);
  const [handlePrint, setHandlePrint] = useState<(() => void) | null>(null);

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);

  const filteredVoters = useMemo(() => voters.filter(
    (voter) =>
      (voter.name.toLowerCase().includes(filter.toLowerCase()) ||
      voter.id.toLowerCase().includes(filter.toLowerCase()) ||
      (voter.nik && voter.nik.includes(filter))) &&
      (categoryFilter === 'all' || voter.category === categoryFilter)
  ), [voters, filter, categoryFilter]);
  
  useEffect(() => {
    // Clear selection when filters change
    setRowSelection({});
    setCurrentPage(1);
  }, [filter, categoryFilter]);
  
  const totalPages = Math.ceil(filteredVoters.length / ITEMS_PER_PAGE);
  const paginatedVoters = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredVoters.slice(startIndex, endIndex);
  }, [filteredVoters, currentPage]);

  const selectedVoterIds = useMemo(() => Object.keys(rowSelection).filter(id => rowSelection[id]), [rowSelection]);
  const numSelected = selectedVoterIds.length;
  
  const votersToPrint = useMemo(() => {
    const categoriesMap = new Map(categories.map(c => [c.id, c]));
    const electionsMap = new Map(elections.map(e => [e.id, e]));

    const getFollowedElections = (voter: Voter) => {
        const voterCategory = categoriesMap.get(voter.category);
        if (!voterCategory || !voterCategory.allowedElections) {
            return [];
        }
        return voterCategory.allowedElections
            .map(electionId => electionsMap.get(electionId))
            .filter((e): e is Election => !!e);
    }
    
    const sourceVoters = numSelected > 0 ? voters.filter(v => rowSelection[v.id]) : paginatedVoters;
    
    return sourceVoters.map(v => ({...v, followedElections: getFollowedElections(v)}));

  }, [numSelected, paginatedVoters, rowSelection, voters, categories, elections]);
  
  const printHandler = useReactToPrint({
    content: () => printComponentRef.current,
    onBeforeGetContent: () => {
      if (votersToPrint.length === 0) {
        toast({
          variant: 'destructive',
          title: 'Tidak ada pemilih untuk dicetak',
          description: 'Tidak ada pemilih dalam daftar atau pilihan saat ini.',
        });
        return Promise.reject();
      }
      toast({ title: 'Menyiapkan cetak...', description: `Mencetak ${votersToPrint.length} kartu pemilih...` });
      return Promise.resolve();
    },
  });

  useEffect(() => {
    setHandlePrint(() => printHandler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [votersToPrint]);

  const handleSelectAll = (checked: boolean) => {
    const newSelection: Record<string, boolean> = {};
    if (checked) {
      paginatedVoters.forEach(voter => newSelection[voter.id] = true);
    }
    setRowSelection(newSelection);
  };

  const handleExportTemplate = () => {
    const csvContent = 'id,nik,name,birthPlace,birthDate,gender,address,category,password\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.href) {
      URL.revokeObjectURL(link.href);
    }
    link.href = URL.createObjectURL(blob);
    link.download = 'voter_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Template berhasil diekspor." });
  };
  
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setImportedData(results.data.filter(row => Object.values(row).some(val => val !== '' && val !== null)));
          setShowImportDialog(true);
        },
        error: (error: any) => {
           toast({
            variant: 'destructive',
            title: 'Error mem-parsing CSV',
            description: error.message,
          });
        }
      });
    }
    // Reset file input to allow re-uploading the same file
    if(event.target) {
      event.target.value = '';
    }
  };
  
  const handleImportSave = async (dataToImport: any[]) => {
    try {
        const categoryNameMap = new Map(categories.map(c => [c.name.replace(/\s+/g, '').toLowerCase(), c.id]));
        
        const updates: Record<string, Omit<Voter, 'id' | 'hasVoted'>> = {};
    
        for (const row of dataToImport) {
            const { id, category, ...rest } = row;

            const categoryId = categoryNameMap.get(category.replace(/\s+/g, '').toLowerCase());
            if (!categoryId) {
                throw new Error(`Kategori "${category}" tidak ditemukan untuk pemilih "${rest.name}".`);
            }
            
            const voterDataForDb: Omit<Voter, 'id' | 'hasVoted'> = {
                nik: rest.nik,
                name: rest.name,
                birthPlace: rest.birthPlace,
                birthDate: rest.birthDate,
                gender: rest.gender as 'Laki-laki' | 'Perempuan' | undefined,
                address: rest.address,
                category: categoryId,
                password: rest.password || Math.random().toString(36).substring(2, 8),
            };
            updates[`/voters/${id}`] = voterDataForDb;
        }

        if (Object.keys(updates).length > 0) {
            await update(ref(db), updates);
        }

      toast({
        title: 'Impor Berhasil',
        description: `${dataToImport.length} pemilih berhasil diimpor. Tabel akan segera diperbarui.`,
      });
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Impor Gagal',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan tidak diketahui saat impor.',
      });
    } finally {
        setShowImportDialog(false);
    }
  }


  const handleAdd = () => {
    setSelectedVoter(null);
    setShowFormDialog(true);
  };

  const handleEdit = (voter: Voter) => {
    setSelectedVoter(voter);
    setShowFormDialog(true);
  };

  const handleDelete = (voter: Voter) => {
    setSelectedVoter(voter);
    setShowDeleteDialog(true);
  };

  const processVoterDeletion = async (voterIdsToDelete: string[]) => {
    if (voterIdsToDelete.length === 0) return;
  
    const updates: { [key: string]: any } = {};
    const voterIdsSet = new Set(voterIdsToDelete);
  
    // 1. Find and nullify votes, preparing to decrement results
    for (const election of elections) {
      if (election.votes) {
        for (const voterId of voterIdsToDelete) {
          if (election.votes[voterId]) {
            const candidateVotedId = election.votes[voterId];
            updates[`/elections/${election.id}/votes/${voterId}`] = null;
  
            // Use a transaction for decrementing to avoid race conditions
            const resultRef = ref(db, `/elections/${election.id}/results/${candidateVotedId}`);
            await runTransaction(resultRef, (currentCount) => {
                return (currentCount || 0) > 0 ? currentCount - 1 : 0;
            });
          }
        }
      }
  
      // 2. Nullify candidate entries
      if (election.candidates) {
        for (const candidateId in election.candidates) {
          const candidate = election.candidates[candidateId];
          // Check if main or vice candidate is being deleted
          if (voterIdsSet.has(candidate.id) || (candidate.viceCandidateId && voterIdsSet.has(candidate.viceCandidateId))) {
            updates[`/elections/${election.id}/candidates/${candidate.id}`] = null;
          }
        }
      }
    }
  
    // 3. Nullify voter records
    for (const voterId of voterIdsToDelete) {
      updates[`/voters/${voterId}`] = null;
    }
    
    // 4. Apply all nullification updates in one go
    if (Object.keys(updates).length > 0) {
      await update(ref(db), updates);
    }
  };

  const confirmDelete = async () => {
    if (!selectedVoter) return;
    setIsDeleting(true);
    try {
      await processVoterDeletion([selectedVoter.id]);
      toast({ title: 'Pemilih berhasil dihapus.' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error menghapus pemilih',
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setSelectedVoter(null);
    }
  };

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
        await processVoterDeletion(selectedVoterIds);
        toast({ title: `${numSelected} pemilih berhasil dihapus.` });
        setRowSelection({});
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Error menghapus pemilih',
            description: error instanceof Error ? error.message : 'Terjadi kesalahan tidak diketahui.',
        });
    } finally {
        setIsBulkDeleting(false);
        setShowBulkDeleteDialog(false);
    }
};


  const handleResetPassword = (voter: Voter) => {
    setSelectedVoter(voter);
    setShowResetPasswordDialog(true);
  };
  
  const onFormSave = async (voterToSave: Voter) => {
    const { id, ...data } = voterToSave;
    await set(ref(db, `voters/${id}`), data);
  };


  return (
    <div className="space-y-4">
       <div style={{ display: "none" }}>
          <PrintLayout ref={printComponentRef} voters={votersToPrint} />
        </div>
       <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept=".csv"
        />
      <div className="flex justify-between items-center gap-2 flex-wrap">
        <form className="flex gap-2">
           <Input
            placeholder="Saring berdasarkan nama, ID, atau NIK..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="max-w-sm"
          />
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Saring berdasarkan kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </form>
        <div className="flex gap-2 flex-wrap">
           <Button variant="outline" onClick={handlePrint} type="button" disabled={!handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Cetak Kartu
            </Button>
           <Button variant="outline" onClick={handleExportTemplate}>
              <Download className="mr-2 h-4 w-4" />
              Ekspor Template
            </Button>
            <Button variant="outline" onClick={handleImportClick}>
              <Upload className="mr-2 h-4 w-4" />
              Impor CSV
            </Button>
            <Button onClick={handleAdd}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Tambah Pemilih
            </Button>
        </div>
      </div>

       {numSelected > 0 && (
        <div className="flex items-center gap-2 p-2 bg-muted rounded-md border">
          <p className="text-sm font-medium">{numSelected} pemilih dipilih.</p>
          <Button size="sm" onClick={() => setShowBulkUpdateDialog(true)}>
            Ubah Kategori
          </Button>
           <Button size="sm" variant="destructive" onClick={() => setShowBulkDeleteDialog(true)}>
            Hapus {numSelected} Pemilih
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setRowSelection({})}>
            Batalkan Pilihan
          </Button>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
               <TableHead padding="checkbox" className="w-[50px]">
                  <Checkbox
                    checked={paginatedVoters.length > 0 && numSelected === paginatedVoters.length}
                    onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                    aria-label="Select all"
                  />
                </TableHead>
              <TableHead>ID Pemilih</TableHead>
              <TableHead>NIK</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Telah Memilih</TableHead>
              <TableHead className="text-right">Tindakan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedVoters.length > 0 ? (
              paginatedVoters.map((voter) => (
                <TableRow key={voter.id} data-state={rowSelection[voter.id] ? 'selected' : ''}>
                  <TableCell padding="checkbox">
                    <Checkbox
                        checked={rowSelection[voter.id] || false}
                        onCheckedChange={(checked) => setRowSelection(prev => ({ ...prev, [voter.id]: !!checked }))}
                        aria-label="Select row"
                    />
                  </TableCell>
                  <TableCell className="font-mono">{voter.id}</TableCell>
                  <TableCell className="font-mono">{voter.nik || 'N/A'}</TableCell>
                  <TableCell className="font-medium">{voter.name}</TableCell>
                  <TableCell>{categoryMap.get(voter.category) || 'N/A'}</TableCell>
                  <TableCell>{voter.hasVoted && Object.keys(voter.hasVoted).length > 0 ? 'Ya' : 'Tidak'}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Buka menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(voter)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Ubah
                        </DropdownMenuItem>
                         <DropdownMenuItem onClick={() => handleResetPassword(voter)}>
                          <KeyRound className="mr-2 h-4 w-4" />
                          Reset Password
                         </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(voter)}>
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
                <TableCell colSpan={7} className="h-24 text-center">
                  Tidak ada pemilih ditemukan.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

       <div className="flex items-center justify-between py-4">
          <div className="text-sm text-muted-foreground">
            Menampilkan {paginatedVoters.length} dari {filteredVoters.length} pemilih.
          </div>
          <div className="flex items-center gap-2">
              <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
              >
                  Sebelumnya
              </Button>
              <span className="text-sm">
                  Halaman {currentPage} dari {totalPages}
              </span>
              <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
              >
                  Berikutnya
              </Button>
          </div>
      </div>

      <VoterFormDialog
        open={showFormDialog}
        onOpenChange={setShowFormDialog}
        voter={selectedVoter}
        categories={categories}
        onSave={onFormSave}
      />
      
      {showImportDialog && <VoterImportDialog 
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        data={importedData}
        categories={categories}
        onSave={handleImportSave}
      />}

      {showBulkUpdateDialog && <BulkUpdateCategoryDialog
        open={showBulkUpdateDialog}
        onOpenChange={setShowBulkUpdateDialog}
        selectedVoterIds={selectedVoterIds}
        categories={categories}
        onSuccess={() => {
            setRowSelection({});
        }}
       />}

       {selectedVoter && (
        <ResetPasswordDialog
          open={showResetPasswordDialog}
          onOpenChange={setShowResetPasswordDialog}
          voter={selectedVoter}
        />
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Ini akan menghapus pemilih "{selectedVoter?.name}" ({selectedVoter?.id}) secara permanen beserta semua data terkait seperti suara dan status kandidat.
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

       <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Apakah Anda benar-benar yakin?</AlertDialogTitle>
              <AlertDialogDescription>
                Tindakan ini tidak dapat dibatalkan. Ini akan menghapus secara permanen {numSelected} pemilih yang dipilih dan semua data terkaitnya (suara, status kandidat, dll).
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive hover:bg-destructive/90" disabled={isBulkDeleting}>
                {isBulkDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Ya, Hapus {numSelected} Pemilih
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

    </div>
  );
}
