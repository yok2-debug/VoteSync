'use server';

import { getElections } from '@/lib/data';
import { RecapitulationClientDisplay } from './components/recapitulation-client-display';

export async function generateStaticParams() {
  const elections = await getElections();
  return elections.map((election) => ({
    electionId: election.id,
  }));
}

export default async function RecapitulationPage({ params }: { params: { electionId: string } }) {
  const { electionId } = params;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Recapitulation</h1>
        <p className="text-muted-foreground">
          Detailed report of election results and voter participation.
        </p>
      </div>
      <RecapitulationClientDisplay electionId={electionId} />
    </div>
  );
}
