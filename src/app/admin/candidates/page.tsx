'use client';
import { useSearchParams } from 'next/navigation';
import { CandidateTable } from './components/candidate-table';
import { useDatabase } from '@/context/database-context';
import Loading from '@/app/loading';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { ReorderCandidatesDialog } from './components/reorder-candidates-dialog';
import { Button } from '@/components/ui/button';
import { ListOrdered } from 'lucide-react';

export default function CandidatesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { elections, isLoading } = useDatabase();
  const [isReorderOpen, setIsReorderOpen] = useState(false);
  
  const selectedElectionId = searchParams.get('electionId');

  const selectedElection = useMemo(() => {
    return elections.find(e => e.id === selectedElectionId);
  }, [elections, selectedElectionId]);

  const handleElectionChange = (electionId: string) => {
    router.push(`/admin/candidates?electionId=${electionId}`);
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Manajemen Kandidat</h1>
        <p className="text-muted-foreground">
          Pilih pemilihan untuk menambah, mengubah, dan mengelola kandidatnya.
        </p>
      </div>
      
      <div className="flex gap-2 items-center">
        <div className="max-w-sm flex-grow">
          <Select onValueChange={handleElectionChange} value={selectedElectionId || ''}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih pemilihan..." />
            </SelectTrigger>
            <SelectContent>
              {elections.map((election) => (
                <SelectItem key={election.id} value={election.id}>
                  {election.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={() => setIsReorderOpen(true)}>
          <ListOrdered className="mr-2 h-4 w-4" />
          Ubah Urutan
        </Button>
      </div>

      {selectedElection ? (
        <CandidateTable election={selectedElection} />
      ) : (
        <div className="flex items-center justify-center h-64 border rounded-md bg-muted/20">
          <p className="text-muted-foreground">Silakan pilih pemilihan untuk melihat kandidat.</p>
        </div>
      )}
      
      <ReorderCandidatesDialog 
        open={isReorderOpen}
        onOpenChange={setIsReorderOpen}
        allElections={elections}
      />
    </div>
  );
}
