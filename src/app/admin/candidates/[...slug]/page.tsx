'use client';
import { redirect, useParams } from 'next/navigation';
import { useDatabase } from '@/context/database-context';
import Loading from '@/app/loading';
import { CandidateForm } from '../components/candidate-form';
import { useMemo } from 'react';

export default function CandidateActionPage() {
  const params = useParams();
  const { elections, isLoading } = useDatabase();
  
  const { slug } = params as { slug: string[] };
  const electionId = slug ? slug[0] : null;
  const action = slug && slug.length > 1 ? slug[1] : 'new';
  const candidateId = slug && slug.length > 2 ? slug[2] : undefined;

  const election = useMemo(() => {
    if (isLoading || !electionId || electionId === 'new') return undefined;
    return elections.find(e => e.id === electionId) || 'redirect';
  }, [isLoading, electionId, elections]);

  if (isLoading || election === undefined) {
    return <Loading />;
  }
  
  if (election === 'redirect') {
    redirect('/admin/candidates');
    return <Loading />;
  }

  const isNew = action === 'new';
  const candidate = !isNew && candidateId ? (election.candidates?.[candidateId] ? { id: candidateId, ...election.candidates[candidateId] } : null) : null;
  
  if (!isNew && !candidate) {
    redirect(`/admin/candidates?electionId=${electionId}`);
    return <Loading />;
  }
  
  const candidateName = !isNew && candidate ? `"${candidate.name}"` : '';
  const initialDataWithVoterId = candidate ? { ...candidate, voterId: candidate.id } : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
            {isNew ? 'Buat Kandidat Baru' : 'Ubah Kandidat'}
        </h1>
        <p className="text-muted-foreground">
            {isNew ? `Tambah kandidat baru untuk pemilihan "${election.name}" dengan memilih dari pemilih yang ada.` : `Perbarui detail untuk ${candidateName} dalam pemilihan "${election.name}".`}
        </p>
      </div>
      <CandidateForm
        electionId={election.id}
        initialData={initialDataWithVoterId}
      />
    </div>
  );
}
