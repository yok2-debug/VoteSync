'use client';
import { PublicNavbar } from '@/components/public-navbar';
import { RealCountDisplay } from './components/real-count-display';
import { useDatabase } from '@/context/database-context';
import Loading from '../loading';
import { DatabaseProvider } from '@/context/database-context';

function RealCountContent() {
  const { elections, voters, categories, isLoading } = useDatabase();
  const activeElections = elections.filter(e => e.status === 'active');

  if (isLoading) {
    return <Loading />;
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-background p-4 pt-20">
      <div className="w-full max-w-7xl mx-auto">
         <div className="flex flex-col space-y-2 text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight">Real Count Pemilihan</h1>
          <p className="text-sm text-muted-foreground">Pantuan hasil perolehan suara secara real-time.</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {activeElections.length > 0 ? (
            activeElections.map(election => (
              <RealCountDisplay
                key={election.id}
                election={election}
                allVoters={voters}
                allCategories={categories}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-10">
              <p className="text-muted-foreground">Tidak ada pemilihan yang sedang aktif saat ini.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}


export default function RealCountPage() {
  return (
    <DatabaseProvider>
      <PublicNavbar />
      <RealCountContent />
    </DatabaseProvider>
  );
}
