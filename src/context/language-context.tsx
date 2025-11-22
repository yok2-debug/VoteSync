'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useDatabase } from './database-context';

type Language = 'id' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { language, setLanguage, isLoading } = useDatabase();
  
  if (isLoading) {
    return null; // Or a loading spinner, but DatabaseProvider already handles loading state
  }

  const value = { language, setLanguage };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    // This can happen if used outside DatabaseProvider, so we point to the root provider.
    throw new Error('useLanguage must be used within a DatabaseProvider');
  }
  return context;
}
