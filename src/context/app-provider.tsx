'use client';

import { ClientOnly } from '@/components/ui/client-only';
import { DatabaseProvider } from './database-context';

export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <ClientOnly>
      <DatabaseProvider>
        {children}
      </DatabaseProvider>
    </ClientOnly>
  );
}
