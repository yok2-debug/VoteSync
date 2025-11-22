'use client';
import { useSearchParams } from 'next/navigation';
import { CandidateTable } from './components/candidate-table';
import { useDatabase } from '@/context/database-context';
import Loading from '@/app/loading';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import Link from 'next/link';

export default function CandidatesPage() {
  const searchParams = useSearchParams();
  const { elections, isLoading } = useDatabase();
  
  const selectedElectionId = searchParams.get('electionId');

  const selectedElection = useMemo(() => {
    return elections.find(e => e.id === selectedElectionId);
  }, [elections, selectedElectionId]);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Manajemen Kandidat</h1>
        <p className="text-muted-foreground">
          {selectedElection 
            ? `Kelola kandidat untuk pemilihan "${selectedElection.name}".`
            : 'Pilih pemilihan dari halaman Manajemen Pemilihan untuk mengelola kandidat.'
          }
        </p>
      </div>

      {selectedElection ? (
        <CandidateTable election={selectedElection} />
      ) : (
        <div className="flex flex-col items-center justify-center h-64 border rounded-md bg-muted/20">
          <p className="text-muted-foreground mb-4">Silakan pilih pemilihan untuk melihat kandidat.</p>
           <Link href="/admin/elections" className="text-sm font-medium text-primary hover:underline">
            Kembali ke Manajemen Pemilihan
          </Link>
        </div>
      )}
    </div>
  );
}
