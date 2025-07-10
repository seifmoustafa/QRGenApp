import React, { useState } from "react";
import { ExcelRecord } from "../types";
import { Table, Eye, Download } from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";
import { useLanguage } from "../contexts/LanguageContext";
import * as XLSX from "xlsx";

interface DataTableProps {
  data: ExcelRecord[];
  onPreview: () => void;
}

const DataTable: React.FC<DataTableProps> = ({ data, onPreview }) => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(data.length / pageSize);

  if (data.length === 0) return null;

  // Get all unique keys from all records
  const allKeys = Array.from(
    new Set(
      data.flatMap((record) =>
        Object.keys(record).filter((key) => key !== "id")
      )
    )
  );

  return (
    <div
      className={`w-full max-w-6xl mx-auto mt-8 ${isRTL ? "font-arabic" : ""}`}
    >
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-teal-600 px-6 py-4">
          <div
            className={`flex items-center justify-between ${
              isRTL ? "flex-row-reverse" : ""
            }`}
          >
            <div
              className={`flex items-center gap-2 ${
                isRTL ? "flex-row-reverse" : ""
              }`}
            >
              <Table className="w-6 h-6 text-white" />
              <h3
                className={`text-xl font-bold text-white ${
                  isRTL ? "text-right" : "text-left"
                }`}
              >
                {t("dataTable.title")} ({data.length} {t("common.records")})
              </h3>
            </div>
            <div className={`flex gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
              <button
                onClick={() => {
                  const rows = data.map((rec) => {
                    const copy = { ...rec };
                    delete copy.id;
                    return copy;
                  });
                  const wb = XLSX.utils.book_new();
                  const ws = XLSX.utils.json_to_sheet(rows);
                  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
                  XLSX.writeFile(wb, "expanded.xlsx");
                }}
                className={`bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  isRTL ? "flex-row-reverse" : ""
                }`}
              >
                <Download className="w-4 h-4" />
                {t("dataTable.downloadExcel")}
              </button>

              <button
                onClick={onPreview}
                className={`bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  isRTL ? "flex-row-reverse" : ""
                }`}
              >
                <Eye className="w-4 h-4" />
                {t("dataTable.previewQRCodes")}
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="overflow-x-auto">
            <table className={`w-full ${isRTL ? "text-right" : "text-left"}`}>
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 bg-gray-50">
                    #
                  </th>
                  {allKeys.map((key) => (
                    <th
                      key={key}
                      className={`py-3 px-4 font-semibold text-gray-700 bg-gray-50 ${
                        isRTL ? "text-right" : "text-left"
                      }`}
                    >
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data
                  .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                  .map((record, index) => (
                    <tr
                      key={record.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors`}
                    >
                      <td
                        className={`py-3 px-4 text-sm text-gray-600 ${
                          isRTL ? "text-right" : "text-left"
                        }`}
                      >
                        {index + 1 + (currentPage - 1) * pageSize}
                      </td>
                      {allKeys.map((key) => (
                        <td
                          key={key}
                          className={`py-3 px-4 text-sm text-gray-900 ${
                            isRTL ? "text-right" : "text-left"
                          }`}
                        >
                          {record[key] || "-"}
                        </td>
                      ))}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
        <div
          className={`mt-4 flex flex-wrap items-center justify-between gap-4 m-4 ${
            isRTL ? "flex-row-reverse" : ""
          }`}
        >
          <div className="flex items-center gap-2">
            <select
              id="pageSize"
              value={pageSize}
              onChange={(e) => {
                setPageSize(parseInt(e.target.value));
                setCurrentPage(1);
              }}
              className="border-gray-300 rounded p-1 text-sm"
            >
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <label htmlFor="pageSize" className="text-sm text-gray-700">
              {t("dataTable.pageSize")}:
            </label>
          </div>
          <div className="text-sm text-gray-500">
            {t("dataTable.showingRange", {
              start: ((currentPage - 1) * pageSize + 1).toString(),
              end: Math.min(currentPage * pageSize, data.length).toString(),
              total: data.length.toString(),
            })}
          </div>

          <div
            className={`flex items-center gap-2 ${
              isRTL ? "flex-row-reverse" : ""
            }`}
          >
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-2 py-1 bg-gray-100 rounded disabled:opacity-50"
            >
              &lt;
            </button>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={(e) => {
                const val = Math.max(
                  1,
                  Math.min(Number(e.target.value), totalPages)
                );
                setCurrentPage(val);
              }}
              className="w-16 border-gray-300 rounded p-1 text-center text-sm"
            />
            <span className="text-sm text-gray-700">
              {t("common.of")} {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-2 py-1 bg-gray-100 rounded disabled:opacity-50"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default DataTable;
