import { getElectionById } from '@/lib/data';
import { ElectionForm } from '../components/election-form';
import { redirect } from 'next/navigation';

type ElectionEditPageProps = {
  params: {
    electionId: string;
  };
};

export default async function ElectionEditPage({ params }: ElectionEditPageProps) {
  const { electionId } = params;
  
  if (electionId === 'new') {
    const newElection = {
      id: 'new',
      name: '',
      description: '',
      status: 'pending' as 'pending' | 'ongoing' | 'completed',
      candidates: {},
      committee: [],
    };
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Election</h1>
          <p className="text-muted-foreground">Fill in the details for the new election.</p>
        </div>
        <ElectionForm election={newElection} />
      </div>
    );
  }

  const election = await getElectionById(electionId);

  if (!election) {
    redirect('/admin/elections');
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Election</h1>
        <p className="text-muted-foreground">Manage the details for "{election.name}".</p>
      </div>
      <ElectionForm election={election} />
    </div>
  );
}
