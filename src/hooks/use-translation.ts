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
  
  const t = (key: string, defaultText?: string): string => {
    const lang = translations[language] || translations.id; // Fallback to 'id'
    const namespaceTranslations = lang[namespace];
    
    if (namespaceTranslations && typeof namespaceTranslations === 'object' && key in namespaceTranslations) {
        const translated = (namespaceTranslations as any)[key];
        return translated || defaultText || key;
    }
    
    if (defaultText) {
        return defaultText;
    }

    console.warn(`Translation not found for key: ${namespace}.${key}`);
    return key;
  };

  return { t, lang: language };
}
