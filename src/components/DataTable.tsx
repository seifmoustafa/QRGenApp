import React from 'react';
import { ExcelRecord } from '../types';
import { Table, Eye } from 'lucide-react';

interface DataTableProps {
  data: ExcelRecord[];
  onPreview: () => void;
}

const DataTable: React.FC<DataTableProps> = ({ data, onPreview }) => {
  if (data.length === 0) return null;

  // Get all unique keys from all records
  const allKeys = Array.from(
    new Set(data.flatMap(record => Object.keys(record).filter(key => key !== 'id')))
  );

  return (
    <div className="w-full max-w-6xl mx-auto mt-8">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-teal-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Table className="w-6 h-6 text-white" />
              <h3 className="text-xl font-bold text-white">
                Data Preview ({data.length} records)
              </h3>
            </div>
            <button
              onClick={onPreview}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Eye className="w-4 h-4" />
              Preview QR Codes
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 bg-gray-50">
                    #
                  </th>
                  {allKeys.map((key) => (
                    <th
                      key={key}
                      className="text-left py-3 px-4 font-semibold text-gray-700 bg-gray-50"
                    >
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.slice(0, 10).map((record, index) => (
                  <tr
                    key={record.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {index + 1}
                    </td>
                    {allKeys.map((key) => (
                      <td key={key} className="py-3 px-4 text-sm text-gray-900">
                        {record[key] || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {data.length > 10 && (
            <div className="mt-4 text-center text-sm text-gray-500">
              Showing first 10 records of {data.length} total records
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataTable;