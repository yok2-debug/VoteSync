'use client';
import { redirect, useParams } from 'next/navigation';
import { RecapitulationDisplay } from './recapitulation-display';
import { useDatabase } from '@/context/database-context';
import Loading from '@/app/loading';
import { useMemo } from 'react';

export function RecapitulationClientPage() {
  const { electionId } = useParams() as { electionId: string };
  const { elections, categories, isLoading } = useDatabase();

  const election = useMemo(() => {
    if (isLoading) return undefined;
    const found = elections.find(e => e.id === electionId);
    return found || 'redirect';
  }, [elections, electionId, isLoading]);

  if (isLoading || election === undefined) {
    return <Loading />;
  }

  if (election === 'redirect') {
    redirect('/admin/recapitulation');
    return <Loading />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Rekapitulasi: {election.name}</h1>
        <p className="text-muted-foreground">
          Laporan rinci hasil pemilihan dan partisipasi pemilih.
        </p>
      </div>
      <RecapitulationDisplay 
        election={election}
        categories={categories}
      />
    </div>
  );
}
