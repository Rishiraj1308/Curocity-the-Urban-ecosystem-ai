'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { translations, type Locale } from '@/lib/translations';

// =====================
// TYPES
// =====================

export type LanguageContextType = {
  language: Locale;
  setLanguage: (lang: Locale) => void;
  t: (key: string) => string;
};

// =====================
// CONTEXT
// =====================

export const LanguageContext = createContext<LanguageContextType | null>(null);

// =====================
// PROVIDER
// =====================

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Locale>('en');

  // Load language from localStorage (client only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem('curocity-lang') as Locale;
      if (stored && translations[stored]) {
        setLanguageState(stored);
      }
    } catch {}
  }, []);

  const setLanguage = useCallback((lang: Locale) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('curocity-lang', lang);
    } catch {}
  }, []);

  // Translation function
  const t = useCallback(
    (key: string): string => {
      return translations[language]?.[key] || translations['en']?.[key] || key;
    },
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

// =====================
// HOOK
// =====================

export function useLanguage(): LanguageContextType {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
