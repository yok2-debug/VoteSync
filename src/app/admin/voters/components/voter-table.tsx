'use client';
import { useState, useRef, useMemo } from 'react';
import type { Voter, Category } from '@/lib/types';
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
import { deleteVoter, importVoters, saveVoter } from '@/lib/actions';
import { ResetPasswordDialog } from './reset-password-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Papa from 'papaparse';
import { VoterImportDialog } from './voter-import-dialog';

type VoterTableProps = {
  voters: Voter[];
  categories: Category[];
};

const ITEMS_PER_PAGE = 100;

export function VoterTable({ voters, categories }: VoterTableProps) {
  const [filter, setFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importedData, setImportedData] = useState<any[]>([]);
  const [selectedVoter, setSelectedVoter] = useState<Voter | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const filteredVoters = useMemo(() => voters.filter(
    (voter) =>
      (voter.name.toLowerCase().includes(filter.toLowerCase()) ||
      voter.id.toLowerCase().includes(filter.toLowerCase()) ||
      (voter.nik && voter.nik.includes(filter))) &&
      (categoryFilter === 'all' || voter.category === categoryFilter)
  ), [voters, filter, categoryFilter]);

  const totalPages = Math.ceil(filteredVoters.length / ITEMS_PER_PAGE);
  const paginatedVoters = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredVoters.slice(startIndex, endIndex);
  }, [filteredVoters, currentPage]);


  const handlePrint = () => {
    const voterIds = filteredVoters.map(v => v.id);
    if (voterIds.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No voters to print',
        description: 'There are no voters in the current filtered list.',
      });
      return;
    }
    const url = `/admin/voters/print?voterIds=${voterIds.join(',')}`;
    window.location.href = url;
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
    toast({ title: "Template exported." });
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
            title: 'Error parsing CSV',
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
      const result = await importVoters(dataToImport);
      toast({
        title: 'Import Successful',
        description: `${result.importedCount} voters were successfully imported.`,
      });
      // The DatabaseProvider will automatically refresh the data
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Import Failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred during import.',
      });
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

  const handleResetPassword = (voter: Voter) => {
    setSelectedVoter(voter);
    setShowResetPasswordDialog(true);
  };


  const confirmDelete = async () => {
    if (!selectedVoter) return;
    setIsDeleting(true);
    try {
      await deleteVoter(selectedVoter.id);
      toast({ title: 'Voter deleted successfully.' });
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Error deleting voter',
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setSelectedVoter(null);
    }
  };
  
  const onFormSave = async (voterToSave: Voter & { isNew?: boolean }) => {
    try {
      const isEditing = !voterToSave.isNew;
      await saveVoter({ ...voterToSave, isEditing });
      toast({
        title: `Voter ${isEditing ? 'updated' : 'created'}`,
        description: `"${voterToSave.name}" has been successfully saved.`,
      });
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Error saving voter',
        description: error instanceof Error ? error.message : 'An unknown error occurred.',
      });
    }
  };


  return (
    <div className="space-y-4">
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
            placeholder="Filter by name, ID, or NIK..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="max-w-sm"
          />
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </form>
        <div className="flex gap-2 flex-wrap">
           <Button variant="outline" onClick={handlePrint} type="button">
              <Printer className="mr-2 h-4 w-4" />
              Print Cards
            </Button>
           <Button variant="outline" onClick={handleExportTemplate}>
              <Download className="mr-2 h-4 w-4" />
              Export Template
            </Button>
            <Button variant="outline" onClick={handleImportClick}>
              <Upload className="mr-2 h-4 w-4" />
              Import CSV
            </Button>
            <Button onClick={handleAdd}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Voter
            </Button>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Voter ID</TableHead>
              <TableHead>NIK</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Has Voted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedVoters.length > 0 ? (
              paginatedVoters.map((voter) => (
                <TableRow key={voter.id}>
                  <TableCell className="font-mono">{voter.id}</TableCell>
                  <TableCell className="font-mono">{voter.nik || 'N/A'}</TableCell>
                  <TableCell className="font-medium">{voter.name}</TableCell>
                  <TableCell>{categoryMap.get(voter.category) || 'N/A'}</TableCell>
                  <TableCell>{voter.hasVoted && Object.keys(voter.hasVoted).length > 0 ? 'Yes' : 'No'}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(voter)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                         <DropdownMenuItem onClick={() => handleResetPassword(voter)}>
                          <KeyRound className="mr-2 h-4 w-4" />
                          Reset Password
                         </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(voter)}>
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
                <TableCell colSpan={6} className="h-24 text-center">
                  No voters found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

       <div className="flex items-center justify-between py-4">
          <div className="text-sm text-muted-foreground">
            Showing {paginatedVoters.length} of {filteredVoters.length} voters.
          </div>
          <div className="flex items-center gap-2">
              <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
              >
                  Previous
              </Button>
              <span className="text-sm">
                  Page {currentPage} of {totalPages}
              </span>
              <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
              >
                  Next
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
      
      <VoterImportDialog 
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        data={importedData}
        categories={categories}
        onSave={handleImportSave}
      />

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
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the voter
              "{selectedVoter?.name}" ({selectedVoter?.id}).
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
