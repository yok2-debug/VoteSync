'use client';
import { redirect, useParams } from 'next/navigation';
import { useDatabase } from '@/context/database-context';
import Loading from '@/app/loading';
import { CandidateForm } from '../components/candidate-form';

export default function CandidateActionPage() {
  const params = useParams();
  const { slug } = params as { slug: string[] };
  const { elections, isLoading } = useDatabase();
  const action = slug[0];
  const electionId = slug.length > 1 ? slug[0] : undefined;
  const candidateId = slug.length > 1 ? slug[1] : undefined;

  if (isLoading) {
    return <Loading />;
  }
  
  if (action === 'new') {
     return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Candidate</h1>
          <p className="text-muted-foreground">Fill in the details for the new candidate.</p>
        </div>
        <CandidateForm initialData={null} allElections={elections} />
      </div>
    );
  }
  
  if (electionId && candidateId) {
    const election = elections.find(e => e.id === electionId);
    if (!election) {
        return redirect('/admin/candidates');
    }
    const candidate = election.candidates?.[candidateId];
     if (!candidate) {
        return redirect('/admin/candidates');
    }

    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Candidate</h1>
          <p className="text-muted-foreground">Update the details for "{candidate.name}".</p>
        </div>
        <CandidateForm 
            initialData={{ candidate, electionId }}
            allElections={elections} 
        />
      </div>
    );
  }

  // Fallback redirect if params are weird
  return redirect('/admin/candidates');
}
