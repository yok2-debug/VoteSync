'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
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
  const [rawVoters, setRawVoters] = useState<Voter[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const enrichedVoters = useMemo(() => {
    if (isLoading || rawVoters.length === 0 || categories.length === 0 || elections.length === 0) {
      return rawVoters;
    }

    const categoriesMap = new Map(categories.map(c => [c.id, c]));
    const electionsMap = new Map(elections.map(e => [e.id, e]));

    return rawVoters.map(voter => {
      const voterCategory = categoriesMap.get(voter.category);
      if (!voterCategory || !voterCategory.allowedElections) {
        return { ...voter, followedElections: [] };
      }
      const followedElections = voterCategory.allowedElections
        .map(electionId => electionsMap.get(electionId))
        .filter((e): e is Election => !!e);
      
      return { ...voter, followedElections };
    });

  }, [rawVoters, categories, elections, isLoading]);


  useEffect(() => {
    const electionsRef = ref(db, 'elections');
    const votersRef = ref(db, 'voters');
    const categoriesRef = ref(db, 'categories');

    let electionsLoaded = false;
    let votersLoaded = false;
    let categoriesLoaded = false;

    const checkAllLoaded = () => {
      if (electionsLoaded && votersLoaded && categoriesLoaded) {
        setIsLoading(false);
      }
    };

    const unsubscribeElections = onValue(electionsRef, (snapshot) => {
      const data = snapshot.val();
      const electionsArray = data ? Object.keys(data).map(id => ({ id, ...data[id] })) : [];
      setElections(electionsArray);
      electionsLoaded = true;
      checkAllLoaded();
    }, () => {
      electionsLoaded = true;
      checkAllLoaded();
    });

    const unsubscribeVoters = onValue(votersRef, (snapshot) => {
      const data = snapshot.val();
      const votersArray = data ? Object.keys(data).map(id => ({ id, ...data[id] })) : [];
      setRawVoters(votersArray);
      votersLoaded = true;
      checkAllLoaded();
    }, () => {
      votersLoaded = true;
      checkAllLoaded();
    });

    const unsubscribeCategories = onValue(categoriesRef, (snapshot) => {
      const data = snapshot.val();
      const categoriesArray = data ? Object.keys(data).map(id => ({ id, ...data[id] })) : [];
      setCategories(categoriesArray);
      categoriesLoaded = true;
      checkAllLoaded();
    }, () => {
      categoriesLoaded = true;
      checkAllLoaded();
    });
    
    // Safety timeout in case Firebase listeners don't fire for empty nodes
    const timeout = setTimeout(() => {
      if(isLoading) {
        setIsLoading(false);
      }
    }, 2500);

    return () => {
      clearTimeout(timeout);
      unsubscribeElections();
      unsubscribeVoters();
      unsubscribeCategories();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = { elections, voters: enrichedVoters, categories, isLoading };

  return <DatabaseContext.Provider value={value}>{children}</DatabaseContext.Provider>;
}

export function useDatabase() {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
}
