'use client';
import { useState } from 'react';
import type { Category, Election, Voter } from '@/lib/types';
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
import { CategoryFormDialog } from './category-form-dialog';
import { useToast } from '@/hooks/use-toast';
import { getVoters } from '@/lib/data';
import { db } from '@/lib/firebase';
import { ref, remove } from 'firebase/database';
import { useDatabase } from '@/context/database-context';

type CategoryTableProps = {
  categories: Category[];
};

export function CategoryTable({ categories }: CategoryTableProps) {
  const [filter, setFilter] = useState('');
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const { voters } = useDatabase();

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(filter.toLowerCase())
  );
  
  const handleAdd = () => {
    setSelectedCategory(null);
    setShowFormDialog(true);
  };
  
  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setShowFormDialog(true);
  };

  const handleDelete = (category: Category) => {
    setSelectedCategory(category);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!selectedCategory) return;
    setIsDeleting(true);
    try {
      const isCategoryInUse = voters.some(voter => voter.category === selectedCategory.id);
  
      if (isCategoryInUse) {
        throw new Error('Tidak dapat menghapus kategori. Kategori ini sedang digunakan oleh satu atau lebih pemilih.');
      }
  
      await remove(ref(db, `categories/${selectedCategory.id}`));
      toast({ title: 'Kategori berhasil dihapus.' });
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Gagal menghapus kategori',
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setSelectedCategory(null);
    }
  };


  const onFormSave = () => {
    // The DatabaseProvider will automatically update the UI.
    // We don't need to manually update the state here.
  }


  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Input
          placeholder="Saring kategori..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={handleAdd}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Tambah Kategori
        </Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Kategori</TableHead>
              <TableHead className="w-[100px] text-right">Tindakan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCategories.length > 0 ? (
              filteredCategories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Buka menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(category)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Ubah
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(category)}>
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
                <TableCell colSpan={2} className="h-24 text-center">
                  Tidak ada kategori ditemukan.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

       <CategoryFormDialog
        open={showFormDialog}
        onOpenChange={setShowFormDialog}
        category={selectedCategory}
        onSave={onFormSave}
      />


      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Ini akan menghapus kategori secara permanen
              "{selectedCategory?.name}".
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
