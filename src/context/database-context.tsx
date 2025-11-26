'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import type { Election, Voter, Category, Role, AdminUser } from '@/lib/types';
import { db } from '@/lib/firebase';
import { ref, onValue, off } from 'firebase/database';
import { initializeDefaultAdmin } from '@/lib/data';

interface DatabaseContextType {
  elections: Election[];
  voters: Voter[];
  categories: Category[];
  roles: Role[];
  adminUsers: AdminUser[];
  isLoading: boolean;
  refreshData: () => void;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export function DatabaseProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState({
    elections: [] as Election[],
    voters: [] as Voter[],
    categories: [] as Category[],
    roles: [] as Role[],
    adminUsers: [] as AdminUser[],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // State untuk melacak data mana yang sudah dimuat pertama kali
  const [initialLoadStatus, setInitialLoadStatus] = useState({
    elections: false,
    voters: false,
    categories: false,
    roles: false,
    users: false,
  });


  const refreshData = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);
  
  useEffect(() => {
    // Reset status loading saat refresh
    setIsLoading(true);
    setInitialLoadStatus({
        elections: false,
        voters: false,
        categories: false,
        roles: false,
        users: false,
    });

    initializeDefaultAdmin();

    const dataRefs = {
      elections: ref(db, 'elections'),
      voters: ref(db, 'voters'),
      categories: ref(db, 'categories'),
      roles: ref(db, 'roles'),
      users: ref(db, 'users'),
    };
    
    const listeners = Object.entries(dataRefs).map(([key, dbRef]) => {
      const typedKey = key as keyof typeof initialLoadStatus;
      return onValue(dbRef, (snapshot) => {
        const value = snapshot.val();
        const array = value ? Object.keys(value).map(id => ({ id, ...value[id] })) : [];
        
        setData(prevData => ({
          ...prevData,
          [key === 'users' ? 'adminUsers' : key]: array,
        }));

        // Tandai bahwa data ini sudah dimuat pertama kali
        setInitialLoadStatus(prevStatus => ({
            ...prevStatus,
            [typedKey]: true,
        }));
      });
    });

    return () => {
      listeners.forEach((listener, index) => {
        const dbRef = Object.values(dataRefs)[index];
        off(dbRef, 'value', listener);
      });
    };
  }, [refreshKey]);

  // Efek terpisah untuk memantau status loading
  useEffect(() => {
    // Jika semua item di initialLoadStatus adalah true, maka loading selesai.
    const allDataLoaded = Object.values(initialLoadStatus).every(status => status === true);
    if (allDataLoaded) {
      setIsLoading(false);
    }
  }, [initialLoadStatus]);

  const value = { ...data, isLoading, refreshData };

  return <DatabaseContext.Provider value={value}>{children}</DatabaseContext.Provider>;
}

export function useDatabase() {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
}
