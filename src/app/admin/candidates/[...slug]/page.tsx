'use client';
import { redirect, useParams } from 'next/navigation';
import { useDatabase } from '@/context/database-context';
import Loading from '@/app/loading';
import { CandidateForm } from '../components/candidate-form';
import { useMemo } from 'react';
import type { Candidate } from '@/lib/types';

export default function CandidateActionPage() {
  const params = useParams();
  const { elections, isLoading } = useDatabase();
  
  const { slug } = params as { slug: string[] };
  const action = slug ? slug[0] : null;
  const candidateId = slug && slug.length > 1 ? slug[1] : undefined;

  const initialData = useMemo(() => {
    if (isLoading || !action) return undefined;

    if (action === 'new') {
        return null;
    }
    
    if (action === 'edit' && candidateId) {
        // Find the first occurrence of the candidate in any election
        for (const election of elections) {
            if (election.candidates?.[candidateId]) {
                const candidateData = election.candidates[candidateId];
                
                // Find all elections this candidate participates in
                const participatedElections = elections
                    .filter(e => e.candidates?.[candidateId])
                    .map(e => ({
                        electionId: e.id,
                        orderNumber: e.candidates?.[candidateId]?.orderNumber || 0
                    }));

                return {
                    id: candidateId,
                    name: candidateData.name,
                    viceCandidateName: candidateData.viceCandidateName,
                    photo: candidateData.photo,
                    vision: candidateData.vision,
                    mission: candidateData.mission,
                    participatedElections: participatedElections,
                } as Partial<Candidate> & { participatedElections: { electionId: string, orderNumber: number }[] };
            }
        }
        return 'redirect'; // Candidate not found in any election
    }

    return 'redirect';
  }, [isLoading, action, candidateId, elections]);


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
        allElections={elections}
      />
    </div>
  );
}
