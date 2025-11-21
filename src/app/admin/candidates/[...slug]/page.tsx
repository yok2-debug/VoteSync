'use client';
import { redirect, useParams } from 'next/navigation';
import { useDatabase } from '@/context/database-context';
import Loading from '@/app/loading';
import { CandidateForm } from '../components/candidate-form';
import { getElections } from '@/lib/data';


export async function generateStaticParams() {
  const elections = await getElections();
  const paths: { slug: string[] }[] = [];

  // Path for creating a new candidate
  paths.push({ slug: ['new'] });

  // Paths for editing existing candidates
  elections.forEach(election => {
    if (election.candidates) {
      Object.keys(election.candidates).forEach(candidateId => {
        paths.push({ slug: ['edit', election.id, candidateId] });
      });
    }
  });

  return paths;
}


export default function CandidateActionPage() {
  const params = useParams();
  const { elections, isLoading } = useDatabase();
  
  if (isLoading) {
    return <Loading />;
  }

  const { slug } = params as { slug: string[] };
  const action = slug ? slug[0] : null;
  const electionId = slug && slug.length > 1 ? slug[1] : undefined;
  const candidateId = slug && slug.length > 2 ? slug[2] : undefined;

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
      if (typeof window !== 'undefined') redirect('/admin/candidates');
      return <Loading />;
    }
    const candidate = election.candidates?.[candidateId];
    if (!candidate) {
      if (typeof window !== 'undefined') redirect('/admin/candidates');
      return <Loading />;
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
  if (typeof window !== 'undefined') redirect('/admin/candidates');
  return <Loading />;
}
