import { getElectionById } from '@/lib/data';
import { redirect } from 'next/navigation';
import { ResultsDisplay } from './components/results-display';

type ElectionResultsPageProps = {
  params: {
    electionId: string;
  };
};

export default async function ElectionResultsPage({ params }: ElectionResultsPageProps) {
  const election = await getElectionById(params.electionId);

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
