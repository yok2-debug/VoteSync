'use client';
import { redirect, useParams } from 'next/navigation';
import { useDatabase } from '@/context/database-context';
import Loading from '@/app/loading';
import { CandidateForm } from '../components/candidate-form';

export default function CandidateActionPage() {
  const params = useParams();
  const { elections, isLoading } = useDatabase();
  
  if (isLoading) {
    return <Loading />;
  }

  const { slug } = params as { slug: string[] };
  const action = slug ? slug[0] : null;
  const electionId = slug && slug.length > 1 ? slug[0] : undefined;
  const candidateId = slug && slug.length > 1 ? slug[1] : undefined;

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

  if (action === 'edit' && electionId && candidateId) {
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

  // Fallback redirect if params are weird or action is not recognized
  return redirect('/admin/candidates');
}
