'use client';
import { PublicNavbar } from '@/components/public-navbar';
import { RealCountDisplay } from './components/real-count-display';
import { useDatabase } from '@/context/database-context';
import Loading from '../loading';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

export default function RealCountPage() {
  const { elections, categories, isLoading } = useDatabase();
  
  const displayedElections = useMemo(() => 
    elections.filter(e => e.showInRealCount === true && e.status === 'active'),
    [elections]
  );

  if (isLoading) {
    return <Loading />;
  }

  return (
    <>
      <PublicNavbar />
      <main className="flex min-h-screen flex-col items-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4 pt-20">
        <div className="w-full max-w-7xl mx-auto">
           <div className="flex flex-col space-y-2 text-center mb-10">
            <h1 className="text-3xl font-bold tracking-tight">Real Count Pemilihan</h1>
            <p className="text-sm text-muted-foreground">Pantauan hasil perolehan suara secara real-time.</p>
          </div>
          
          <div className={cn(
            "grid grid-cols-1 gap-8",
            displayedElections.length > 1 ? "lg:grid-cols-2" : ""
          )}>
            {displayedElections.length > 0 ? (
              displayedElections.map(election => (
                <RealCountDisplay
                  key={election.id}
                  election={election}
                  categories={categories}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-10">
                <p className="text-muted-foreground">Tidak ada pemilihan yang ditampilkan di Real Count saat ini.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
