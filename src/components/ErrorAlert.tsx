import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { useLanguage } from '../contexts/LanguageContext';

interface ErrorAlertProps {
  message: string;
  onClose: () => void;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({ message, onClose }) => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  return (
    <div className={`fixed top-4 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg max-w-md z-50 ${isRTL ? 'left-4 font-arabic' : 'right-4'}`}>
      <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
        <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
          <h4 className={`text-sm font-medium text-red-800 mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>{t('common.error')}</h4>
          <p className={`text-sm text-red-700 ${isRTL ? 'text-right' : 'text-left'}`}>{message}</p>
        </div>
        <button
          onClick={onClose}
          className={`text-red-400 hover:text-red-600 transition-colors`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ErrorAlert;