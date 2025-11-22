'use client';
import { VoterTable } from './components/voter-table';
import { useDatabase } from '@/context/database-context';
import Loading from '@/app/loading';

export default function VotersPage() {
  const { voters, categories, isLoading } = useDatabase();

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Voter Management</h1>
        <p className="text-muted-foreground">
          Add, import, and manage all voters in the system.
        </p>
      </div>
      <VoterTable voters={voters} categories={categories} />
    </div>
  );
}
