'use client';
import { VoterTable } from './components/voter-table';
import { useDatabase } from '@/context/database-context';
import Loading from '@/app/loading';
import { DatabaseProvider } from '@/context/database-context';

function VotersPageContent() {
  const { voters, categories, isLoading } = useDatabase();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Voter Management</h1>
        <p className="text-muted-foreground">
          Add, import, and manage all voters in the system.
        </p>
      </div>
      {isLoading ? (
        <Loading />
      ) : (
        <VoterTable voters={voters} categories={categories} />
      )}
    </div>
  );
}

export default function VotersPage() {
    return (
        <DatabaseProvider>
            <VotersPageContent />
        </DatabaseProvider>
    )
}
