'use client';
import { useState } from 'react';
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
import { MoreHorizontal, PlusCircle, Download, Upload } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

type VoterTableProps = {
  initialVoters: Voter[];
  categories: Category[];
};

export function VoterTable({ initialVoters, categories }: VoterTableProps) {
  const [voters, setVoters] = useState<Voter[]>(initialVoters);
  const [filter, setFilter] = useState('');
  const { toast } = useToast();

  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const filteredVoters = voters.filter(
    (voter) =>
      voter.name.toLowerCase().includes(filter.toLowerCase()) ||
      voter.id.toLowerCase().includes(filter.toLowerCase())
  );

  const handleExportTemplate = () => {
    const csvContent = 'id_pemilih,nama,kategori\n';
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
  
  const handleImport = () => {
    // This is a placeholder for the actual import functionality
    toast({ title: "Import clicked", description: "This feature is under development." });
  };


  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-2">
        <Input
          placeholder="Filter by name or ID..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex gap-2">
           <Button variant="outline" onClick={handleExportTemplate}>
              <Download className="mr-2 h-4 w-4" />
              Export Template
            </Button>
            <Button variant="outline" onClick={handleImport}>
              <Upload className="mr-2 h-4 w-4" />
              Import CSV
            </Button>
            <Button>
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
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Has Voted</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVoters.length > 0 ? (
              filteredVoters.map((voter) => (
                <TableRow key={voter.id}>
                  <TableCell className="font-mono">{voter.id}</TableCell>
                  <TableCell className="font-medium">{voter.name}</TableCell>
                  <TableCell>{categoryMap.get(voter.category) || 'N/A'}</TableCell>
                  <TableCell>{voter.hasVoted && Object.keys(voter.hasVoted).length > 0 ? 'Yes' : 'No'}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                         <DropdownMenuItem>Reset Password</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
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
                  No voters found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
