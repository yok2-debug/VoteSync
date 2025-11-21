'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Election, Voter, Category } from '@/lib/types';
import { db } from '@/lib/firebase';
import { ref, onValue, get, set } from 'firebase/database';

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

  // This function correctly handles both array-based (from JSON import) and object-based (Firebase native) voter data structures.
  const processVoters = (data: any): Voter[] => {
      if (!data) return [];
      
      // Handle array structure from JSON, filtering out null/empty entries.
      if (Array.isArray(data)) {
          return data
              .filter(v => v) // Filter out null/undefined entries in the array
              .map((voter, index) => {
                  const id = voter.id || voter.nik || String(index);
                  if (voter.id) return voter;
                  return {
                    id: id,
                    ...voter
                  };
              });
      }

      // Handle object structure from Firebase
      return Object.keys(data).map(id => ({ id, ...data[id] }));
  }

  useEffect(() => {
    const electionsRef = ref(db, 'elections');
    const votersRef = ref(db, 'voters');
    const categoriesRef = ref(db, 'categories');
    
    // Function to fetch initial data once
    const fetchInitialData = async () => {
      try {
        const [electionsSnap, votersSnap, categoriesSnap] = await Promise.all([
          get(electionsRef),
          get(votersRef),
          get(categoriesRef),
        ]);
        
        const electionsData = electionsSnap.val();
        const electionsArray = electionsData ? Object.keys(electionsData).map(id => ({ id, ...electionsData[id] })) : [];
        setElections(electionsArray);

        const votersData = votersSnap.val();
        const votersArray = processVoters(votersData);
        setVoters(votersArray);

        const categoriesData = categoriesSnap.val();
        const categoriesArray = categoriesData ? Object.keys(categoriesData).map(id => ({ id, ...categoriesData[id] })) : [];
        setCategories(categoriesArray);

      } catch (error) {
        console.error("Failed to fetch initial data:", error);
      } finally {
        // This is crucial: set loading to false after the initial fetch attempt
        setIsLoading(false);
      }
    };
    
    fetchInitialData();

    // Set up live listeners for real-time updates
    const unsubscribeElections = onValue(electionsRef, (snapshot) => {
      const data = snapshot.val();
      const electionsArray = data ? Object.keys(data).map(id => ({ id, ...data[id] })) : [];
      setElections(electionsArray);
    });

    const unsubscribeVoters = onValue(votersRef, (snapshot) => {
      const data = snapshot.val();
      const votersArray = processVoters(data);
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
