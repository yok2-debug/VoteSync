import { getVoters, getCategories } from '@/lib/data';
import { VoterTable } from './components/voter-table';

export default async function VotersPage() {
  const [voters, categories] = await Promise.all([
    getVoters(),
    getCategories(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Voter Management</h1>
        <p className="text-muted-foreground">
          Add, import, and manage all voters in the system.
        </p>
      </div>
      <VoterTable initialVoters={voters} categories={categories} />
    </div>
  );
}
