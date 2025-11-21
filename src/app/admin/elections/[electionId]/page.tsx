'use client';
import { ElectionForm } from '../components/election-form';
import { redirect, useParams } from 'next/navigation';
import { useDatabase } from '@/context/database-context';
import Loading from '@/app/loading';
import { useMemo } from 'react';
import { getElections } from '@/lib/data';

export async function generateStaticParams() {
  const elections = await getElections();
  const paths = elections.map(election => ({
    electionId: election.id,
  }));
  
  // Add path for creating a new election
  paths.push({ electionId: 'new' });

  return paths;
}

export default function ElectionEditPage() {
  const { electionId } = useParams() as { electionId: string };
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
    // This might happen briefly on first load or if the election is deleted
    // A loading state or a specific "not found" component could be better
    // For static export, redirecting might be tricky, but let's keep it for client-side logic
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
