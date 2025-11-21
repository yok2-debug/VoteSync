'use client';
import { ElectionForm } from '../../components/election-form';
import { redirect, useParams } from 'next/navigation';
import { useDatabase } from '@/context/database-context';
import Loading from '@/app/loading';
import { useMemo } from 'react';

export function ElectionEditForm({ electionId }: { electionId: string }) {
  const { elections, isLoading } = useDatabase();

  const election = useMemo(() => {
    if (isLoading) return null;
    if (electionId === 'new') {
      return {
        id: 'new',
        name: '',
        description: '',
        status: 'pending' as 'pending' | 'active',
        candidates: {},
        committee: [],
        startDate: undefined,
        endDate: undefined,
      };
    }
    return elections.find(e => e.id === electionId);
  }, [elections, electionId, isLoading]);

  if (isLoading) {
    return <Loading />;
  }

  if (!election) {
    if (typeof window !== 'undefined') {
      redirect('/admin/elections');
    }
    return <Loading />;
  }
  
  const isNew = election.id === 'new';

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{isNew ? 'Create New Election' : 'Edit Election'}</h1>
        <p className="text-muted-foreground">
          {isNew ? 'Fill in the details for the new election.' : `Manage the details for "${election.name}".`}
        </p>
      </div>
      <ElectionForm election={election} />
    </div>
  );
}
