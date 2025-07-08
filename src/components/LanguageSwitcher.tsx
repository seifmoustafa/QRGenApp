import React from 'react';
import { Languages } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from '../hooks/useTranslation';

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();

  const toggleLanguage = () => {
    const newLanguage = language === 'en' ? 'ar' : 'en';
    setLanguage(newLanguage);
  };

  const currentLanguageLabel = language === 'en' ? t('language.english') : t('language.arabic');
  const targetLanguage = language === 'en' ? t('language.arabic') : t('language.english');

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      title={t('language.switchTo', { language: targetLanguage })}
    >
      <Languages className="w-4 h-4" />
      <span className="hidden sm:inline">{currentLanguageLabel}</span>
    </button>
  );
};

export default LanguageSwitcher;