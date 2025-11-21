'use server';

import { getElections } from '@/lib/data';
import { VoteClientPage } from './components/vote-client-page';

export async function generateStaticParams() {
  const elections = await getElections();
  return elections.map((election) => ({
    electionId: election.id,
  }));
}

export default async function VotePage({ params }: { params: { electionId: string } }) {
  return <VoteClientPage electionId={params.electionId} />;
}
