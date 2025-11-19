'use client';
import { CandidateTable } from './components/candidate-table';
import { useDatabase } from '@/context/database-context';
import Loading from '@/app/loading';

export default function CandidatesPage() {
  const { elections, isLoading } = useDatabase();

  return (
    <>
      {isLoading ? (
        <Loading />
      ) : (
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Candidate Management</h1>
            <p className="text-muted-foreground">
              Add, edit, and manage all candidates for elections.
            </p>
          </div>
          <CandidateTable allElections={elections} />
        </div>
      )}
    </>
  );
}
