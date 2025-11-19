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

export function VoterImportDialog({ open, onOpenChange, data, categories, onSave }: VoterImportDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validatedData, setValidatedData] = useState<ValidatedRow[]>([]);
  const { toast } = useToast();

  const categoryNameMap = useMemo(() => new Map(categories.map(c => [c.name.toLowerCase(), c.id])), [categories]);
  
  useEffect(() => {
    async function validateData() {
        if (!open || data.length === 0) {
            setValidatedData([]);
            return;
        }

        const existingVoters = await getVoters();
        const existingVoterIds = new Set(existingVoters.map(v => v.id));
        const currentImportIds = new Set();

        const validated = data.map(row => {
            const errors: string[] = [];
            
            if (!row.id || typeof row.id !== 'string' || row.id.trim() === '') {
                errors.push('Missing or invalid ID.');
            } else if (existingVoterIds.has(row.id)) {
                errors.push(`ID '${row.id}' already exists in the database.`);
            } else if (currentImportIds.has(row.id)) {
                errors.push(`Duplicate ID '${row.id}' within this import file.`);
            } else {
                currentImportIds.add(row.id);
            }
            
            if (!row.name || typeof row.name !== 'string' || row.name.trim() === '') {
                errors.push('Missing name.');
            }
            
            if (!row.category || !categoryNameMap.has(row.category.toLowerCase())) {
                errors.push(`Category '${row.category}' is not a valid, existing category.`);
            }

            return {
                data: row,
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
    const dataToImport = validatedData.filter(row => row.isValid).map(row => {
      const categoryId = categoryNameMap.get(row.data.category.toLowerCase());
      return { ...row.data, category: categoryId };
    });
    
    try {
        await onSave(dataToImport);
        onOpenChange(false);
    } catch(e) {
        // Errors will be caught and toasted by the parent component
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
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
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Password</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {validatedData.map((row, index) => (
                <TableRow key={`import-row-${index}`} className={!row.isValid ? 'bg-destructive/10' : ''}>
                  <TableCell>{row.data.id}</TableCell>
                  <TableCell>{row.data.name}</TableCell>
                  <TableCell>{row.data.category}</TableCell>
                  <TableCell>{row.data.password || '(auto-generated)'}</TableCell>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleConfirmImport} disabled={isSubmitting || hasErrors || validRowCount === 0}>
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
