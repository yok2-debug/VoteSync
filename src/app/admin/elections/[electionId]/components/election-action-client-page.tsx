'use client';
import { ElectionForm } from '../components/election-form';
import { redirect, useParams } from 'next/navigation';
import { useDatabase } from '@/context/database-context';
import Loading from '@/app/loading';
import { useMemo } from 'react';

export function ElectionActionClientPage() {
  const { electionId } = useParams() as { electionId: string };
  const { elections, isLoading } = useDatabase();

  const election = useMemo(() => {
    if (isLoading) return undefined;
    
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
    const found = elections.find(e => e.id === electionId);
    return found || 'redirect';
  }, [elections, electionId, isLoading]);

  if (isLoading || election === undefined) {
    return <Loading />;
  }

  if (election === 'redirect') {
    redirect('/admin/elections');
    return <Loading />;
  }
  
  const isNew = election.id === 'new';

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{isNew ? 'Buat Pemilihan Baru' : 'Ubah Pemilihan'}</h1>
        <p className="text-muted-foreground">
          {isNew ? 'Isi detail untuk pemilihan baru.' : `Kelola detail untuk "${election.name}".`}
        </p>
      </div>
      <ElectionForm election={election} />
    </div>
  );
}
