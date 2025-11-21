'use server';
import { getElections } from '@/lib/data';
import { ElectionEditForm } from './components/election-edit-form';

export async function generateStaticParams() {
  const elections = await getElections();
  const paths = elections.map((election) => ({
    electionId: election.id,
  }));

  // Add path for creating a new election
  paths.push({ electionId: 'new' });

  return paths;
}

export default async function ElectionEditPage({ params }: { params: { electionId: string } }) {
  return <ElectionEditForm electionId={params.electionId} />;
}
