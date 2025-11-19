'use client';
import { ElectionForm } from '../components/election-form';
import { redirect, useParams } from 'next/navigation';
import { useDatabase } from '@/context/database-context';
import Loading from '@/app/loading';

export default function ElectionEditPage() {
  const { electionId } = useParams() as { electionId: string };
  const { elections, isLoading } = useDatabase();

  if (isLoading) {
    return <Loading />;
  }

  if (electionId === 'new') {
    const newElection = {
      id: 'new',
      name: '',
      description: '',
      status: 'pending' as 'pending' | 'active',
      candidates: {},
      committee: [],
      startDate: undefined,
      endDate: undefined,
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

  const election = elections.find(e => e.id === electionId);

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
