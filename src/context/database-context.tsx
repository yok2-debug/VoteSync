'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Election, Voter, Category } from '@/lib/types';
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';

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

    let initialLoads = 0;
    const requiredLoads = 3;

    const checkInitialLoad = () => {
        initialLoads++;
        if (initialLoads >= requiredLoads) {
            setIsLoading(false);
        }
    }
    
    const unsubscribeElections = onValue(electionsRef, (snapshot) => {
      const data = snapshot.val();
      const electionsArray = data ? Object.keys(data).map(id => ({ id, ...data[id] })) : [];
      setElections(electionsArray);
      if (!isLoading) checkInitialLoad();
    }, () => checkInitialLoad());

    const unsubscribeVoters = onValue(votersRef, (snapshot) => {
      const data = snapshot.val();
      const votersArray = data ? Object.keys(data).map(id => ({ id, ...data[id] })) : [];
      setVoters(votersArray);
       if (!isLoading) checkInitialLoad();
    }, () => checkInitialLoad());

    const unsubscribeCategories = onValue(categoriesRef, (snapshot) => {
      const data = snapshot.val();
      const categoriesArray = data ? Object.keys(data).map(id => ({ id, ...data[id] })) : [];
      setCategories(categoriesArray);
       if (!isLoading) checkInitialLoad();
    }, () => checkInitialLoad());
    
    // Initial check in case db is empty
    setTimeout(() => {
        if(isLoading) setIsLoading(false);
    }, 1500);


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
