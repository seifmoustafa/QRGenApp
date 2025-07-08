import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

type TranslationKey = string;
type TranslationParams = Record<string, string | number>;

interface Translations {
  [key: string]: any;
}

const translations: Record<string, Translations> = {
  en: {},
  ar: {}
};

// Load translation files
const loadTranslations = async () => {
  try {
    const [enTranslations, arTranslations] = await Promise.all([
      import('../locales/en.json'),
      import('../locales/ar.json')
    ]);
    
    translations.en = enTranslations.default;
    translations.ar = arTranslations.default;
  } catch (error) {
    console.error('Error loading translations:', error);
  }
};

// Initialize translations
loadTranslations();

export const useTranslation = () => {
  const { language } = useLanguage();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check if translations are loaded
    if (translations.en && Object.keys(translations.en).length > 0) {
      setIsLoaded(true);
    }
  }, []);

  const t = (key: TranslationKey, params?: TranslationParams): string => {
    if (!isLoaded) return key;

    const keys = key.split('.');
    let value: any = translations[language];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to English if key not found in current language
        value = translations.en;
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object' && fallbackKey in value) {
            value = value[fallbackKey];
          } else {
            return key; // Return key if not found in fallback either
          }
        }
        break;
      }
    }

    if (typeof value !== 'string') {
      return key;
    }

    // Replace parameters in the translation
    if (params) {
      return value.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
        return params[paramKey]?.toString() || match;
      });
    }

    return value;
  };

  return { t, isLoaded };
};