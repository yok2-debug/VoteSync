'use client';
import { redirect, useParams } from 'next/navigation';
import { ResultsDisplay } from './components/results-display';
import { useDatabase } from '@/context/database-context';
import Loading from '@/app/loading';
import { useMemo } from 'react';

export default function ElectionResultsPage() {
  const { electionId } = useParams() as { electionId: string };
  const { elections, isLoading } = useDatabase();

  const election = useMemo(() => elections.find(e => e.id === electionId), [elections, electionId]);

  if (isLoading) {
    return <Loading />;
  }

  if (!election) {
    return redirect('/admin/results');
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{election.name} - Results</h1>
        <p className="text-muted-foreground">
          Real-time vote count and analysis.
        </p>
      </div>
      <ResultsDisplay election={election} />
    </div>
  );
}
