'use client';
import { useLanguage } from '@/context/language-context';
import idTranslations from '@/locales/id.json';
import enTranslations from '@/locales/en.json';

type TranslationKey = keyof typeof idTranslations;

const translations = {
  id: idTranslations,
  en: enTranslations,
};

export function useTranslation(namespace: TranslationKey) {
  const { language } = useLanguage();
  
  const t = (key: string): string => {
    const lang = translations[language];
    const namespaceTranslations = lang[namespace];
    
    if (namespaceTranslations && typeof namespaceTranslations === 'object' && key in namespaceTranslations) {
        return (namespaceTranslations as any)[key];
    }
    
    console.warn(`Translation not found for key: ${namespace}.${key}`);
    return key;
  };

  return { t };
}
