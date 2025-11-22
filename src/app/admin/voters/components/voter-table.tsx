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
import { ResetPasswordDialog } from './reset-password-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Papa from 'papaparse';
import { VoterImportDialog } from './voter-import-dialog';
import { renderToStaticMarkup } from 'react-dom/server';
import { VoterCard } from '../../voters/print/components/voter-card';
import { db } from '@/lib/firebase';
import { ref, remove, update, set } from 'firebase/database';
import * as z from 'zod';
import { useDatabase } from '@/context/database-context';

type VoterTableProps = {
  voters: Voter[];
  categories: Category[];
};

const ITEMS_PER_PAGE = 100;

export function VoterTable({ voters, categories }: VoterTableProps) {
  const { voters: allEnrichedVoters } = useDatabase();
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
  const [isPrinting, setIsPrinting] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);

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


  const handlePrint = async () => {
    if (filteredVoters.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No voters to print',
        description: 'There are no voters in the current filtered list.',
      });
      return;
    }

    setIsPrinting(true);
    toast({ title: 'Preparing print...', description: 'Using latest available voter data...' });

    try {
      const idsToPrint = new Set(filteredVoters.map(v => v.id));
      const votersToPrint = allEnrichedVoters.filter(v => idsToPrint.has(v.id));

      const printContent = renderToStaticMarkup(
        <div className="grid grid-cols-4 gap-2">
          {votersToPrint.map(voter => <VoterCard key={voter.id} voter={voter} />)}
        </div>
      );

      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (!doc) {
        throw new Error('Could not access iframe document.');
      }

      doc.open();
      doc.write(`
        <html>
          <head>
            <title>Print Voter Cards</title>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.19/tailwind.min.css">
            <style>
              @page {
                size: A4;
                margin: 1cm;
              }
              body {
                background-color: #fff !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              * {
                box-shadow: none !important;
                text-shadow: none !important;
              }
            </style>
          </head>
          <body>
            ${printContent}
          </body>
        </html>
      `);
      doc.close();
      
      iframe.contentWindow?.focus();

      // Use a timeout to ensure content is fully rendered before printing
      setTimeout(() => {
        iframe.contentWindow?.print();
        document.body.removeChild(iframe);
        setIsPrinting(false);
      }, 500);

    } catch (e) {
      toast({ variant: 'destructive', title: 'Print failed', description: e instanceof Error ? e.message : 'Could not generate print content.'});
      setIsPrinting(false);
    }
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
        const categoryNameMap = new Map(categories.map(c => [c.name.replace(/\s+/g, '').toLowerCase(), c.id]));
        
        const votersToImportForDb: Record<string, Omit<Voter, 'id' | 'hasVoted'>> = {};

        const importVoterSchema = z.object({
            id: z.string().min(1, 'ID is required'),
            nik: z.string().optional(),
            name: z.string().min(1, 'Name is required'),
            birthPlace: z.string().optional(),
            birthDate: z.string().optional(),
            gender: z.string().optional(),
            address: z.string().optional(),
            category: z.string().min(1, 'Category is required'),
            password: z.string().optional(),
        });
    
        for (const row of dataToImport) {
            const validation = importVoterSchema.safeParse(row);
            if (!validation.success) {
                throw new Error(`Invalid data in CSV: ${JSON.stringify(validation.error.flatten().fieldErrors)}`);
            }
            const { id, category, ...rest } = validation.data;

            const categoryId = categoryNameMap.get(category.replace(/\s+/g, '').toLowerCase());
            if (!categoryId) {
                throw new Error(`Category "${category}" not found for voter "${rest.name}".`);
            }
            
            const voterDataForDb: Omit<Voter, 'id' | 'hasVoted'> = {
                ...rest,
                category: categoryId,
                password: rest.password || Math.random().toString(36).substring(2, 8),
            };
            votersToImportForDb[`voters/${id}`] = voterDataForDb;
        }

        if (Object.keys(votersToImportForDb).length > 0) {
            await update(ref(db), votersToImportForDb);
        }

      toast({
        title: 'Import Successful',
        description: `${dataToImport.length} voters were successfully imported. The table will update shortly.`,
      });
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Import Failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred during import.',
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

  const handleResetPassword = (voter: Voter) => {
    setSelectedVoter(voter);
    setShowResetPasswordDialog(true);
  };


  const confirmDelete = async () => {
    if (!selectedVoter) return;
    setIsDeleting(true);
    try {
      await remove(ref(db, `voters/${selectedVoter.id}`));
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
      const { isNew, ...savedVoterData } = voterToSave;
      const voterRef = ref(db, `voters/${savedVoterData.id}`);

      if (isNew) {
        // Create new voter
        const dataToSet = { ...savedVoterData };
        delete (dataToSet as any).id; // Don't save ID inside the object itself
        await set(voterRef, dataToSet);
      } else {
        // Update existing voter
        const updates: { [key: string]: any } = {};
        Object.keys(savedVoterData).forEach(key => {
          if (key !== 'id') {
            updates[`/voters/${savedVoterData.id}/${key}`] = (savedVoterData as any)[key];
          }
        });
        await update(ref(db), updates);
      }

      toast({
        title: `Voter ${isNew ? 'created' : 'updated'}`,
        description: `"${savedVoterData.name}" has been successfully saved.`,
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
           <Button variant="outline" onClick={handlePrint} type="button" disabled={isPrinting}>
              {isPrinting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
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
      
      {showImportDialog && <VoterImportDialog 
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        data={importedData}
        categories={categories}
        onSave={handleImportSave}
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
