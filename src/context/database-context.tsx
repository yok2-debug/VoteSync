
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Election, Voter, Category } from '@/lib/types';
import { db } from '@/lib/firebase';
import { ref, onValue, get } from 'firebase/database';

interface DatabaseContextType {
  elections: Election[];
  voters: Voter[];
  categories: Category[];
  isLoading: boolean;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

const processFirebaseData = <T>(data: any, idField: string = 'id'): T[] => {
    if (!data) return [];
    if (Array.isArray(data)) {
        return data.filter(Boolean).map((item, index) => ({
            [idField]: item[idField] || String(index),
            ...item
        }));
    }
    if (typeof data === 'object' && data !== null) {
        return Object.keys(data).map(key => ({
            [idField]: key,
            ...data[key]
        }));
    }
    return [];
};


export function DatabaseProvider({ children }: { children: ReactNode }) {
  const [elections, setElections] = useState<Election[]>([]);
  const [voters, setVoters] = useState<Voter[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const electionsRef = ref(db, 'elections');
    const votersRef = ref(db, 'voters');
    const categoriesRef = ref(db, 'categories');
    
    let initialFetchCompleted = false;

    const fetchInitialData = async () => {
      try {
        const [electionsSnap, votersSnap, categoriesSnap] = await Promise.all([
          get(electionsRef),
          get(votersRef),
          get(categoriesRef),
        ]);
        
        if (initialFetchCompleted) return;

        setElections(processFirebaseData<Election>(electionsSnap.val()));
        setVoters(processFirebaseData<Voter>(votersSnap.val()));
        setCategories(processFirebaseData<Category>(categoriesSnap.val()));

      } catch (error) {
        console.error("Database-Context: Failed to fetch initial data:", error);
      } finally {
        if (!initialFetchCompleted) {
          setIsLoading(false);
          initialFetchCompleted = true;
        }
      }
    };
    
    fetchInitialData();

    // Set up live listeners for real-time updates
    const unsubscribeElections = onValue(electionsRef, (snapshot) => {
      setElections(processFirebaseData<Election>(snapshot.val()));
    }, (error) => {
        console.error("Database-Context: elections listener error:", error);
    });

    const unsubscribeVoters = onValue(votersRef, (snapshot) => {
      setVoters(processFirebaseData<Voter>(snapshot.val(), 'id'));
    }, (error) => {
        console.error("Database-Context: voters listener error:", error);
    });

    const unsubscribeCategories = onValue(categoriesRef, (snapshot) => {
      setCategories(processFirebaseData<Category>(snapshot.val()));
    }, (error) => {
        console.error("Database-Context: categories listener error:", error);
    });

    // Cleanup listeners on unmount
    return () => {
      unsubscribeElections();
      unsubscribeVoters();
      unsubscribeCategories();
    };
  }, []);

  const value = { elections, voters, categories, isLoading };

  return <DatabaseContext.Provider value={value}>{children}</DatabaseContext.Provider>;
}

export function useDatabase() {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
}
