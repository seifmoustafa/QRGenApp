import React, { useCallback } from 'react';
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { ExcelRecord } from '../types';

interface ExcelUploaderProps {
  onDataLoad: (data: ExcelRecord[]) => void;
  onError: (error: string) => void;
}

const ExcelUploader: React.FC<ExcelUploaderProps> = ({ onDataLoad, onError }) => {
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      onError('Please upload a valid Excel file (.xlsx, .xls) or CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        if (jsonData.length === 0) {
          onError('The Excel file appears to be empty');
          return;
        }

        // Add unique IDs to each record
        const dataWithIds = jsonData.map((record, index) => ({
          id: `record_${index + 1}_${Date.now()}`,
          ...record
        })) as ExcelRecord[];

        onDataLoad(dataWithIds);
      } catch (error) {
        onError('Error reading the Excel file. Please ensure it\'s a valid Excel file.');
      }
    };
    
    reader.readAsArrayBuffer(file);
  }, [onDataLoad, onError]);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6" />
            Excel QR Code Generator
          </h2>
          <p className="text-blue-100 text-sm mt-1">
            Upload your Excel file to generate QR codes for each record
          </p>
        </div>
        
        <div className="p-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
              id="excel-upload"
            />
            <label
              htmlFor="excel-upload"
              className="cursor-pointer flex flex-col items-center gap-4"
            >
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Upload className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <p className="text-lg font-medium text-gray-700">
                  Click to upload Excel file
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Supports .xlsx, .xls, and .csv files
                </p>
              </div>
            </label>
          </div>
          
          <div className="mt-6 bg-blue-50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Tips for best results:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>Ensure your Excel file has headers in the first row</li>
                  <li>Each row will generate a unique QR code</li>
                  <li>QR codes will contain all data from each record</li>
                  <li>You can export all QR codes as PDF for printing</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExcelUploader;