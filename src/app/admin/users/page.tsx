'use client';
import { useDatabase } from '@/context/database-context';
import Loading from '@/app/loading';
import { UserTable } from './components/user-table';

export default function UsersPage() {
  const { adminUsers, roles, isLoading } = useDatabase();

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Manajemen Pengguna</h1>
        <p className="text-muted-foreground">
          Kelola pengguna administrator dan peran mereka.
        </p>
      </div>
      <UserTable users={adminUsers} roles={roles} />
    </div>
  );
}
