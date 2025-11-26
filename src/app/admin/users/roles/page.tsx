'use client';
import { useDatabase } from '@/context/database-context';
import Loading from '@/app/loading';
import { RoleTable } from './components/role-table';

export default function RolesPage() {
  const { roles, isLoading } = useDatabase();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Manajemen Peran</h1>
        <p className="text-muted-foreground">
          Buat dan kelola peran pengguna beserta hak aksesnya.
        </p>
      </div>
      {isLoading ? <Loading /> : <RoleTable roles={roles} />}
    </div>
  );
}
