'use client';
import { redirect, useParams } from 'next/navigation';
import { useDatabase } from '@/context/database-context';
import Loading from '@/app/loading';
import { CandidateForm } from '../../components/candidate-form';
import { useMemo } from 'react';

export function CandidateActionClientPage() {
  const params = useParams();
  const { elections, isLoading } = useDatabase();
  
  const { slug } = params as { slug: string[] };

  // For /new -> slug = ['new']
  // For /edit/{electionId}/{candidateId} -> slug = ['edit', electionId, candidateId]
  const action = slug ? slug[0] : 'new';
  const isNew = action === 'new';
  
  const electionId = !isNew ? slug[1] : null;
  const candidateId = !isNew ? slug[2] : null;

  const election = useMemo(() => {
    if (isLoading || !electionId) return undefined;
    return elections.find(e => e.id === electionId);
  }, [isLoading, electionId, elections]);

  const candidate = useMemo(() => {
    if (isNew || !election || !candidateId) return null;
    const cand = election.candidates?.[candidateId];
    if (!cand) return 'redirect';
    return { ...cand, id: candidateId, voterId: candidateId, electionId: election.id };
  }, [isNew, election, candidateId]);

  if (isLoading) {
    return <Loading />;
  }
  
  if (!isNew && !election) {
      // If we are editing but the election isn't found, redirect.
      redirect('/admin/candidates');
      return <Loading />;
  }

  if (candidate === 'redirect') {
    redirect(`/admin/candidates`);
    return <Loading />;
  }
  
  const candidateName = !isNew && candidate ? `"${candidate.name}"` : '';

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
            {isNew ? 'Buat Kandidat Baru' : 'Ubah Kandidat'}
        </h1>
        <p className="text-muted-foreground">
            {isNew ? `Pilih pemilihan dan cari pemilih untuk membuat kandidat baru.` : `Perbarui detail untuk ${candidateName}.`}
        </p>
      </div>
      <CandidateForm
        initialData={candidate}
        allElections={elections}
      />
    </div>
  );
}
