'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Language = 'id' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('id');

  useEffect(() => {
    const storedLanguage = localStorage.getItem('votesync-lang') as Language;
    if (storedLanguage && ['id', 'en'].includes(storedLanguage)) {
      setLanguageState(storedLanguage);
    }
  }, []);

  const setLanguage = (newLanguage: Language) => {
    localStorage.setItem('votesync-lang', newLanguage);
    setLanguageState(newLanguage);
    // Force a full reload to ensure all components get the new language
    window.location.reload();
  };
  
  const value = { language, setLanguage };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
