import React, { useCallback } from "react";
import { Upload, FileSpreadsheet, AlertCircle } from "lucide-react";
import * as XLSX from "xlsx";
import { ExcelRecord } from "../types";
import { useTranslation } from "../hooks/useTranslation";
import { useLanguage } from "../contexts/LanguageContext";

interface ExcelUploaderProps {
  onDataLoad: (data: ExcelRecord[]) => void;
  onError: (error: string) => void;
}

const ExcelUploader: React.FC<ExcelUploaderProps> = ({
  onDataLoad,
  onError,
}) => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const allowedTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
        "text/csv",
      ];
      if (!allowedTypes.includes(file.type)) {
        onError(t("uploader.errors.invalidFileType"));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData =
            XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

          if (jsonData.length === 0) {
            onError(t("uploader.errors.emptyFile"));
            return;
          }

          const timestamp = Date.now();
          const dataWithIds = jsonData.map((record, idx) => ({
            id: `record_${timestamp}_${idx + 1}`,
            ...record,
          })) as ExcelRecord[];

          const groups = new Map<string, ExcelRecord[]>();

          dataWithIds.forEach((rec) => {
            const key = JSON.stringify(
              Object.fromEntries(
                Object.entries(rec).filter(
                  ([k]) => k !== "item_no" && k !== "id"
                )
              )
            );
            if (!groups.has(key)) {
              groups.set(key, []);
            }
            groups.get(key)!.push(rec);
          });

          const expanded: ExcelRecord[] = [];

          groups.forEach((records) => {
            const base = records[0];
            const count = Number(base.item_count) || records.length;

            expanded.push(...records);

            if (records.length < count) {
              const existingNos = records
                .map((r) => Number(r.item_no))
                .filter((n) => !Number.isNaN(n));

              const missingNos: number[] = [];
              for (let i = 1; i <= count; i++) {
                if (!existingNos.includes(i)) {
                  missingNos.push(i);
                }
              }

              for (const no of missingNos) {
                expanded.push({
                  ...base,
                  id: `${base.id}_${no}`,
                  item_no: no,
                });
              }
            }
          });

          onDataLoad(expanded);
          // Clear the file input so the same file can be uploaded again
          event.target.value = "";
        } catch {
          onError(t("uploader.errors.readError"));
        }
      };
      reader.readAsArrayBuffer(file);
    },
    [onDataLoad, onError, t]
  );

  return (
    <div
      className={`w-full max-w-4xl mx-auto ${isRTL ? "font-arabic" : ""}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div
          className={`
            bg-gradient-to-r from-blue-600 to-purple-600
            px-6 py-4
            flex flex-col
            ${isRTL ? "items-end" : "items-start"}
          `}
        >
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6" />
            {t("uploader.title")}
          </h2>
          <p className="text-blue-100 text-sm mt-1">{t("uploader.subtitle")}</p>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Upload Box */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
            <input
              id="excel-upload"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label
              htmlFor="excel-upload"
              className="
                cursor-pointer
                flex flex-col items-center justify-center
                gap-4
                text-center
              "
            >
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Upload className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-lg font-medium text-gray-700">
                {t("uploader.clickToUpload")}
              </p>
              <p className="text-sm text-gray-500">
                {t("uploader.supportedFormats")}
              </p>
            </label>
          </div>

          {/* Tips */}
          <div className="mt-6 bg-blue-50 rounded-lg p-4">
            <div
              className={`flex items-start gap-3 ${
                isRTL ? "flex-row-reverse" : ""
              }`}
            >
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 self-start" />
              <div className="flex-1 text-sm text-blue-800 text-start">
                <p className="font-medium mb-1">{t("uploader.tips.title")}</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>{t("uploader.tips.tip1")}</li>
                  <li>{t("uploader.tips.tip2")}</li>
                  <li>{t("uploader.tips.tip3")}</li>
                  <li>{t("uploader.tips.tip4")}</li>
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
