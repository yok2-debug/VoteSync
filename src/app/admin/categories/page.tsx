import { getCategories, getElections } from '@/lib/data';
import { CategoryTable } from './components/category-table';

export default async function CategoriesPage() {
  const [categories, elections] = await Promise.all([
    getCategories(),
    getElections(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Category Management</h1>
        <p className="text-muted-foreground">
          Manage voter categories for elections.
        </p>
      </div>
      <CategoryTable initialCategories={categories} allElections={elections} />
    </div>
  );
}
