import { getElections } from '@/lib/data';
import { ElectionTable } from './components/election-table';

export default async function ElectionsPage() {
  const elections = await getElections();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Election Management</h1>
        <p className="text-muted-foreground">
          Create, view, and manage all elections in the system.
        </p>
      </div>
      <ElectionTable initialElections={elections} />
    </div>
  );
}
