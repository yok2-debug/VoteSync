import { getCategories, getElections, getVoters } from '@/lib/data';
import { PublicNavbar } from '@/components/public-navbar';
import { RealCountDisplay } from './components/real-count-display';

export default async function RealCountPage() {
  const [elections, allVoters, allCategories] = await Promise.all([
    getElections(),
    getVoters(),
    getCategories(),
  ]);

  const activeElections = elections.filter(e => e.status === 'active');

  return (
    <>
      <PublicNavbar />
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
                  allVoters={allVoters}
                  allCategories={allCategories}
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
    </>
  );
}
