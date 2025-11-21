'use server';
import { getElections } from '@/lib/data';
import { CandidateAction } from './components/candidate-action';

// This function generates static paths for 'new' and 'edit' actions.
export async function generateStaticParams() {
  const elections = await getElections();
  const paths: { slug: string[] }[] = [];

  // Path for creating a new candidate
  paths.push({ slug: ['new'] });

  // Paths for editing existing candidates
  for (const election of elections) {
    if (election.candidates) {
      for (const candidateId in election.candidates) {
        paths.push({ slug: ['edit', election.id, candidateId] });
      }
    }
  }

  return paths;
}


export default function CandidateActionPage({ params }: { params: { slug: string[] } }) {
  const { slug } = params;
  return <CandidateAction slug={slug} />;
}
