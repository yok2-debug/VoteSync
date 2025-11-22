'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Election, Voter, Category } from '@/lib/types';
import { db } from '@/lib/firebase';
import { ref, onValue, update } from 'firebase/database';

interface DatabaseContextType {
  elections: Election[];
  voters: Voter[];
  categories: Category[];
  language: 'id' | 'en';
  setLanguage: (language: 'id' | 'en') => void;
  isLoading: boolean;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export function DatabaseProvider({ children }: { children: ReactNode }) {
  const [elections, setElections] = useState<Election[]>([]);
  const [voters, setVoters] = useState<Voter[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [language, setLanguage] = useState<'id' | 'en'>('id');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const electionsRef = ref(db, 'elections');
    const votersRef = ref(db, 'voters');
    const categoriesRef = ref(db, 'categories');
    const settingsRef = ref(db, 'settings');

    let initialLoadComplete = {
        elections: false,
        settings: false,
    };

    const checkInitialLoad = () => {
        if (Object.values(initialLoadComplete).every(Boolean)) {
            setIsLoading(false);
        }
    }
    
    const unsubscribeElections = onValue(electionsRef, (snapshot) => {
      const data = snapshot.val();
      const electionsArray = data ? Object.keys(data).map(id => ({ id, ...data[id] })) : [];
      setElections(electionsArray);
      if (!initialLoadComplete.elections) {
        initialLoadComplete.elections = true;
        checkInitialLoad();
      }
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
    
    const unsubscribeSettings = onValue(settingsRef, (snapshot) => {
        const data = snapshot.val();
        if (data && data.language) {
            setLanguage(data.language);
        }
        if (!initialLoadComplete.settings) {
            initialLoadComplete.settings = true;
            checkInitialLoad();
        }
    });


    return () => {
      unsubscribeElections();
      unsubscribeVoters();
      unsubscribeCategories();
      unsubscribeSettings();
    };
  }, []);

  const handleSetLanguage = (newLanguage: 'id' | 'en') => {
    update(ref(db, 'settings'), { language: newLanguage });
    // The onValue listener will update the state automatically
  };

  const value = { elections, voters, categories, isLoading, language, setLanguage: handleSetLanguage };

  return <DatabaseContext.Provider value={value}>{children}</DatabaseContext.Provider>;
}

export function useDatabase() {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
}
