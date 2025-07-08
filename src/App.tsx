import React, { useState, useEffect } from 'react';
import { LanguageProvider } from './contexts/LanguageContext';
import ExcelUploader from './components/ExcelUploader';
import DataTable from './components/DataTable';
import QRCodeGenerator from './components/QRCodeGenerator';
import PDFExporter from './components/PDFExporter';
import ErrorAlert from './components/ErrorAlert';
import LanguageSwitcher from './components/LanguageSwitcher';
import { ExcelRecord, QRCodeData } from './types';
import { Sparkles } from 'lucide-react';
import { useTranslation } from './hooks/useTranslation';
import { useLanguage } from './contexts/LanguageContext';

const AppContent: React.FC = () => {
  const { t } = useTranslation();
  const { isRTL, language } = useLanguage();
  const [excelData, setExcelData] = useState<ExcelRecord[]>([]);
  const [qrCodes, setQrCodes] = useState<QRCodeData[]>([]);
  const [showQRCodes, setShowQRCodes] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = t('header.title');
  }, [language, t]);

  const handleDataLoad = (data: ExcelRecord[]) => {
    setExcelData(data);
    setShowQRCodes(false);
    setQrCodes([]);
    setError(null);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleQRCodesGenerated = (codes: QRCodeData[]) => {
    setQrCodes(codes);
  };

  const handlePreview = () => {
    setShowQRCodes(true);
  };

  const handleCloseError = () => {
    setError(null);
  };

  const handleReset = () => {
    setExcelData([]);
    setQrCodes([]);
    setShowQRCodes(false);
    setError(null);
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 ${isRTL ? 'font-arabic' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className={`text-2xl font-bold text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t('header.title')}
                </h1>
                <p className={`text-sm text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t('header.subtitle')}
                </p>
              </div>
            </div>
            <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <LanguageSwitcher />
              {excelData.length > 0 && (
                <button
                  onClick={handleReset}
                  className={`bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors ${isRTL ? 'font-arabic' : ''}`}
                >
                  {t('common.startOver')}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Step 1: Upload Excel */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
              <span className="text-xl font-bold text-blue-600">1</span>
            </div>
            <h2 className={`text-xl font-semibold text-gray-800 mb-2 ${isRTL ? 'text-center font-arabic' : 'text-center'}`}>
              {t('steps.step1.title')}
            </h2>
            <p className={`text-gray-600 mb-8 ${isRTL ? 'text-center font-arabic' : 'text-center'}`}>
              {t('steps.step1.description')}
            </p>
          </div>
          
          <ExcelUploader onDataLoad={handleDataLoad} onError={handleError} />

          {/* Step 2: Preview Data */}
          {excelData.length > 0 && (
            <>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
                  <span className="text-xl font-bold text-green-600">2</span>
                </div>
                <h2 className={`text-xl font-semibold text-gray-800 mb-2 ${isRTL ? 'text-center font-arabic' : 'text-center'}`}>
                  {t('steps.step2.title')}
                </h2>
                <p className={`text-gray-600 mb-8 ${isRTL ? 'text-center font-arabic' : 'text-center'}`}>
                  {t('steps.step2.description')}
                </p>
              </div>
              
              <DataTable data={excelData} onPreview={handlePreview} />
            </>
          )}

          {/* Step 3: Generate QR Codes */}
          {showQRCodes && excelData.length > 0 && (
            <>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-4">
                  <span className="text-xl font-bold text-purple-600">3</span>
                </div>
                <h2 className={`text-xl font-semibold text-gray-800 mb-2 ${isRTL ? 'text-center font-arabic' : 'text-center'}`}>
                  {t('steps.step3.title')}
                </h2>
                <p className={`text-gray-600 mb-8 ${isRTL ? 'text-center font-arabic' : 'text-center'}`}>
                  {t('steps.step3.description')}
                </p>
              </div>
              
              <QRCodeGenerator
                data={excelData}
                onQRCodesGenerated={handleQRCodesGenerated}
              />
            </>
          )}

          {/* Step 4: Export to PDF */}
          {qrCodes.length > 0 && (
            <>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mb-4">
                  <span className="text-xl font-bold text-orange-600">4</span>
                </div>
                <h2 className={`text-xl font-semibold text-gray-800 mb-2 ${isRTL ? 'text-center font-arabic' : 'text-center'}`}>
                  {t('steps.step4.title')}
                </h2>
                <p className={`text-gray-600 mb-8 ${isRTL ? 'text-center font-arabic' : 'text-center'}`}>
                  {t('steps.step4.description')}
                </p>
              </div>
              
              <PDFExporter qrCodes={qrCodes} />
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className={`max-w-7xl mx-auto px-4 py-6 text-center text-gray-600 ${isRTL ? 'font-arabic' : ''}`}>
          <p>
            {t('footer.builtWith')}
          </p>
        </div>
      </footer>

      {/* Error Alert */}
      {error && <ErrorAlert message={error} onClose={handleCloseError} />}
    </div>
  );
};

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

export default App;