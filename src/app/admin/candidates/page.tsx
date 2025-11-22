'use client';
import { useSearchParams } from 'next/navigation';
import { CandidateTable } from './components/candidate-table';
import { useDatabase } from '@/context/database-context';
import Loading from '@/app/loading';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';

export default function CandidatesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { elections, isLoading } = useDatabase();
  
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
      
      <div className="max-w-sm">
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

      {selectedElection ? (
        <CandidateTable election={selectedElection} />
      ) : (
        <div className="flex items-center justify-center h-64 border rounded-md bg-muted/20">
          <p className="text-muted-foreground">Silakan pilih pemilihan untuk melihat kandidat.</p>
        </div>
      )}
    </div>
  );
}
