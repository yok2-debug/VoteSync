'use client';
import { CategoryTable } from './components/category-table';
import { useDatabase } from '@/context/database-context';
import Loading from '@/app/loading';

export default function CategoriesPage() {
  const { categories, isLoading } = useDatabase();

  return (
    <>
      {isLoading ? (
        <Loading />
      ) : (
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Manajemen Kategori</h1>
            <p className="text-muted-foreground">
              Kelola kategori pemilih untuk pemilihan.
            </p>
          </div>
          <CategoryTable categories={categories} />
        </div>
      )}
    </>
  );
}
