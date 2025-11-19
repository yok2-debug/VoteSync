'use client';
import { redirect, useParams } from 'next/navigation';
import { RecapitulationDisplay } from './components/recapitulation-display';
import { useDatabase } from '@/context/database-context';
import Loading from '@/app/loading';

export default function RecapitulationPage() {
  const { electionId } = useParams() as { electionId: string };
  const { elections, voters, categories, isLoading } = useDatabase();

  if (isLoading) {
    return <Loading />;
  }

  const election = elections.find(e => e.id === electionId);

  if (!election) {
    redirect('/admin/recapitulation');
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Recapitulation: {election.name}</h1>
        <p className="text-muted-foreground">
          Detailed report of election results and voter participation.
        </p>
      </div>
      <RecapitulationDisplay 
        election={election} 
        allVoters={voters}
        allCategories={categories}
      />
    </div>
  );
}
