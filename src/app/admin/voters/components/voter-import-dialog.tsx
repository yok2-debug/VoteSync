
'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type { Category } from '@/lib/types';
import { getVoters } from '@/lib/data';

interface VoterImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: any[];
  categories: Category[];
  onSave: (dataToImport: any[]) => Promise<void>;
}

type ValidatedRow = {
  data: any;
  isValid: boolean;
  errors: string[];
};

// Helper function to normalize category names for robust matching
const normalizeCategory = (name: string) => name ? name.replace(/\s+/g, '').toLowerCase() : '';


export function VoterImportDialog({ open, onOpenChange, data, categories, onSave }: VoterImportDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validatedData, setValidatedData] = useState<ValidatedRow[]>([]);
  const { toast } = useToast();

  const categoryNameMap = useMemo(() => new Map(categories.map(c => [normalizeCategory(c.name), c.id])), [categories]);
  
  useEffect(() => {
    async function validateData() {
        const filteredData = data.filter(row => row && typeof row === 'object' && Object.values(row).some(val => val !== null && val !== ''));

        if (!open || filteredData.length === 0) {
            setValidatedData([]);
            return;
        }

        const existingVoters = await getVoters();
        const existingVoterIds = new Set(existingVoters.map(v => v.id));
        const currentImportIds = new Set();

        const validated = filteredData.map(row => {
            const errors: string[] = [];
            const cleanRow = {
                id: typeof row.id === 'string' ? row.id.trim() : row.id,
                nik: row.nik ? String(row.nik).trim() : '',
                name: typeof row.name === 'string' ? row.name.trim() : row.name,
                birthPlace: typeof row.birthPlace === 'string' ? row.birthPlace.trim() : '',
                birthDate: typeof row.birthDate === 'string' ? row.birthDate.trim() : '',
                gender: typeof row.gender === 'string' ? row.gender.trim() : '',
                address: typeof row.address === 'string' ? row.address.trim() : '',
                category: typeof row.category === 'string' ? row.category.trim() : row.category,
                password: row.password
            };
            
            if (!cleanRow.id) {
                errors.push('Missing or invalid ID.');
            } else if (existingVoterIds.has(cleanRow.id)) {
                errors.push(`ID '${cleanRow.id}' already exists in the database.`);
            } else if (currentImportIds.has(cleanRow.id)) {
                errors.push(`Duplicate ID '${cleanRow.id}' within this import file.`);
            } else {
                currentImportIds.add(cleanRow.id);
            }
            
            if (!cleanRow.name) {
                errors.push('Missing name.');
            }
            
            if (!cleanRow.category || !categoryNameMap.has(normalizeCategory(cleanRow.category))) {
                errors.push(`Category '${cleanRow.category}' is not a valid, existing category.`);
            }
            
            if (cleanRow.gender && !['Laki-laki', 'Perempuan'].includes(cleanRow.gender)) {
                errors.push(`Invalid gender: '${cleanRow.gender}'. Must be 'Laki-laki' or 'Perempuan'.`);
            }

            return {
                data: cleanRow,
                isValid: errors.length === 0,
                errors
            };
        });
        setValidatedData(validated);
    }
    validateData();

  }, [data, open, categoryNameMap]);
  
  const hasErrors = useMemo(() => validatedData.some(row => !row.isValid), [validatedData]);
  const validRowCount = useMemo(() => validatedData.filter(row => row.isValid).length, [validatedData]);
  const invalidRowCount = useMemo(() => validatedData.length - validRowCount, [validatedData, validRowCount]);


  const handleConfirmImport = async () => {
    setIsSubmitting(true);
    const dataToImport = validatedData
      .filter(row => row.isValid)
      .map(row => row.data);
    
    try {
        await onSave(dataToImport);
        onOpenChange(false);
    } catch(e) {
        // Errors will be caught and toasted by the parent component (voter-table)
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl">
        <DialogHeader>
          <DialogTitle>Import Voters from CSV</DialogTitle>
          <DialogDescription>
            Review the data below before importing. Rows with errors will be skipped.
          </DialogDescription>
        </DialogHeader>
        
        {invalidRowCount > 0 && (
            <div className="flex items-center gap-2 p-3 rounded-md border border-destructive/50 bg-destructive/10 text-destructive">
                <AlertTriangle className="h-5 w-5"/>
                <p className="text-sm font-medium">{invalidRowCount} row(s) have errors and will not be imported. Please fix the CSV and try again or proceed with the valid rows.</p>
            </div>
        )}
        
        <ScrollArea className="h-[50vh] mt-4">
          <Table>
            <TableHeader className="sticky top-0 bg-background">
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>NIK</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {validatedData.map((row, index) => (
                <TableRow key={`import-row-${index}`} className={!row.isValid ? 'bg-destructive/10' : ''}>
                  <TableCell>
                    {row.isValid ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">Valid</Badge>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {row.errors.map((err, i) => (
                          <Badge key={i} variant="destructive">{err}</Badge>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{row.data.id}</TableCell>
                  <TableCell>{row.data.nik}</TableCell>
                  <TableCell>{row.data.name}</TableCell>
                  <TableCell>{row.data.category}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {row.data.birthPlace}, {row.data.birthDate} <br/>
                    {row.data.gender} <br/>
                    {row.data.address}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleConfirmImport} disabled={isSubmitting || validRowCount === 0}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importing...
              </>
            ) : (
                `Import ${validRowCount} Valid Voters`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
