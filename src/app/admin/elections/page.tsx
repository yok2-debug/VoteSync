'use client';
import { ElectionTable } from './components/election-table';
import { useDatabase } from '@/context/database-context';
import Loading from '@/app/loading';

export default function ElectionsPage() {
  const { elections, isLoading } = useDatabase();

  return (
    <>
      {isLoading ? (
        <Loading />
      ) : (
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Manajemen Pemilihan</h1>
            <p className="text-muted-foreground">
              Buat, lihat, dan kelola semua pemilihan dalam sistem.
            </p>
          </div>
          <ElectionTable elections={elections} />
        </div>
      )}
    </>
  );
}
