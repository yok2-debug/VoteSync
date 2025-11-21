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

export function DatabaseProvider({ children }: { children: ReactNode }) {
  const [elections, setElections] = useState<Election[]>([]);
  const [voters, setVoters] = useState<Voter[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const electionsRef = ref(db, 'elections');
    const votersRef = ref(db, 'voters');
    const categoriesRef = ref(db, 'categories');

    // Set initial loading state
    setIsLoading(true);

    // Function to fetch initial data once
    const fetchInitialData = async () => {
      try {
        await Promise.all([
          get(electionsRef),
          get(votersRef),
          get(categoriesRef),
        ]);
      } finally {
        // This ensures loading is set to false even if one of the fetches fails,
        // preventing the app from being stuck on loading forever.
        // The onValue listeners below will still provide live updates.
        setIsLoading(false);
      }
    };
    
    fetchInitialData();

    // Set up live listeners
    const unsubscribeElections = onValue(electionsRef, (snapshot) => {
      const data = snapshot.val();
      const electionsArray = data ? Object.keys(data).map(id => ({ id, ...data[id] })) : [];
      setElections(electionsArray);
    });

    const unsubscribeVoters = onValue(votersRef, (snapshot) => {
      const data = snapshot.val();
      const votersArray = data ? Object.keys(data).map(id => ({ id, ...data[id] })) : [];
      setVoters(votersArray);
    });

    const unsubscribeCategories = onValue(categoriesRef, (snapshot) => {
      const data = snapshot.val();
      const categoriesArray = data ? Object.keys(data).map(id => ({ id, ...data[id] })) : [];
      setCategories(categoriesArray);
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
