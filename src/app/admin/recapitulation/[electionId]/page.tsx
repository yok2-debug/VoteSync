import { getElectionById, getVoters, getCategories } from '@/lib/data';
import { redirect } from 'next/navigation';
import { RecapitulationDisplay } from './components/recapitulation-display';

type RecapitulationPageProps = {
  params: {
    electionId: string;
  };
};

export default async function RecapitulationPage({ params }: RecapitulationPageProps) {
  const { electionId } = params;

  const [election, allVoters, allCategories] = await Promise.all([
    getElectionById(electionId),
    getVoters(),
    getCategories(),
  ]);

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
        allVoters={allVoters}
        allCategories={allCategories}
      />
    </div>
  );
}
