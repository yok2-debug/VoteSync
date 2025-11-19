'use client';
import { redirect, useParams } from 'next/navigation';
import { ResultsDisplay } from './components/results-display';
import { useDatabase } from '@/context/database-context';
import Loading from '@/app/loading';

export default function ElectionResultsPage() {
  const { electionId } = useParams() as { electionId: string };
  const { elections, isLoading } = useDatabase();

  if (isLoading) {
    return <Loading />;
  }

  const election = elections.find(e => e.id === electionId);

  if (!election) {
    redirect('/admin/results');
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
