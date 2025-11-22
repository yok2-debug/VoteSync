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
  const action = slug ? slug[0] : null;
  const electionId = slug && slug.length > 1 ? slug[1] : undefined;
  const candidateId = slug && slug.length > 2 ? slug[2] : undefined;

  const initialData = useMemo(() => {
    if (isLoading || !action) return undefined;

    if (action === 'new') {
        return null;
    }
    
    if (action === 'edit' && electionId && candidateId) {
        const election = elections.find(e => e.id === electionId);
        if (!election) return 'redirect';

        const candidate = election.candidates?.[candidateId];
        if (!candidate) return 'redirect';

        return { ...candidate, id: candidateId };
    }

    return 'redirect';
  }, [isLoading, action, electionId, candidateId, elections]);


  if (isLoading || initialData === undefined) {
    return <Loading />;
  }
  
  if (initialData === 'redirect') {
    redirect('/admin/candidates');
    return <Loading />;
  }
  
  const isNew = initialData === null;
  const candidateName = !isNew ? `"${initialData.name}"` : '';

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
            {isNew ? 'Create New Candidate' : 'Edit Candidate'}
        </h1>
        <p className="text-muted-foreground">
            {isNew ? 'Fill in the details for the new candidate.' : `Update the details for ${candidateName}.`}
        </p>
      </div>
      <CandidateForm
        initialData={initialData}
        electionId={electionId}
        allElections={elections}
      />
    </div>
  );
}
