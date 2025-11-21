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

// This function robustly handles both array-based (from JSON import) 
// and object-based (Firebase native) voter data structures.
const processVoters = (data: any): Voter[] => {
    if (!data) return [];
    
    // Handle array structure, filtering out null/empty entries.
    if (Array.isArray(data)) {
        return data.filter(v => v).map((voter, index) => {
            // If ID is missing, create one from NIK or index, but prioritize existing ID.
            const id = voter.id || voter.nik || String(index);
            return { id, ...voter };
        });
    }

    // Handle object structure from Firebase
    return Object.keys(data).map(id => ({ id, ...data[id] }));
}

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

        const electionsData = electionsSnap.val();
        setElections(electionsData ? Object.keys(electionsData).map(id => ({ id, ...electionsData[id] })) : []);

        const votersData = votersSnap.val();
        setVoters(processVoters(votersData));

        const categoriesData = categoriesSnap.val();
        setCategories(categoriesData ? Object.keys(categoriesData).map(id => ({ id, ...categoriesData[id] })) : []);

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
      const data = snapshot.val();
      setElections(data ? Object.keys(data).map(id => ({ id, ...data[id] })) : []);
    }, (error) => {
        console.error("Database-Context: elections listener error:", error);
    });

    const unsubscribeVoters = onValue(votersRef, (snapshot) => {
      const data = snapshot.val();
      setVoters(processVoters(data));
    }, (error) => {
        console.error("Database-Context: voters listener error:", error);
    });

    const unsubscribeCategories = onValue(categoriesRef, (snapshot) => {
      const data = snapshot.val();
      setCategories(data ? Object.keys(data).map(id => ({ id, ...data[id] })) : []);
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
