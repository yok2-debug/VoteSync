'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import { CandidateTable } from './components/candidate-table';
import { useDatabase } from '@/context/database-context';
import Loading from '@/app/loading';
import { useMemo } from 'react';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

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
          Pilih pemilihan untuk mengelola kandidat yang berpartisipasi.
        </p>
      </div>

      <div className="max-w-sm space-y-2">
          <Label htmlFor="election-select">Pilih Pemilihan</Label>
          <Select onValueChange={handleElectionChange} value={selectedElectionId || ''}>
              <SelectTrigger id="election-select">
                  <SelectValue placeholder="Pilih pemilihan..." />
              </SelectTrigger>
              <SelectContent>
                  {elections.length > 0 ? (
                    elections.map((election) => (
                      <SelectItem key={election.id} value={election.id}>
                          {election.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground">Belum ada pemilihan.</div>
                  )}
              </SelectContent>
          </Select>
      </div>

      {selectedElection ? (
        <CandidateTable election={selectedElection} />
      ) : (
        <div className="flex flex-col items-center justify-center h-64 border rounded-md bg-muted/20">
          <p className="text-muted-foreground mb-4">Silakan pilih pemilihan untuk melihat kandidat.</p>
        </div>
      )}
    </div>
  );
}
