'use client';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import pt from './locales/pt.json';
import en from './locales/en.json';
import es from './locales/es.json';

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        pt: { translation: pt },
        en: { translation: en },
        es: { translation: es },
      },
      fallbackLng: 'pt',
      supportedLngs: ['pt', 'en', 'es'],
      detection: {
        order: ['localStorage', 'navigator'],
        caches: ['localStorage'],
        lookupLocalStorage: 'pixgo_lang',
      },
      interpolation: { escapeValue: false },
      react: { useSuspense: false },
    });
}

export default i18n;

export const LANGUAGES = [
  { code: 'pt', label: 'Português', flag: '🇧🇷', native: 'Português' },
  { code: 'en', label: 'English',   flag: '🇺🇸', native: 'English' },
  { code: 'es', label: 'Español',   flag: '🇪🇸', native: 'Español' },
];
