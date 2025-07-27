import React, { useCallback } from "react";
import { Upload, FileSpreadsheet, AlertCircle } from "lucide-react";
import * as XLSX from "xlsx";
import { ExcelRecord, ExpandedData } from "../types";
import { PREVIEW_ROW_LIMIT } from "../utils/excelConstants";
import { useTranslation } from "../hooks/useTranslation";
import { useLanguage } from "../contexts/LanguageContext";

interface ExcelUploaderProps {
  /**
   * Called when parsing is successful.
   * @param data The processed data, including a preview slice, grouped records, and total count.
   */
  onDataLoad: (data: ExpandedData) => void;
  /**
   * Called when any error occurs during file validation or parsing.
   * @param error A translation-ready error message.
   */
  onError: (error: string) => void;
}

/**
 * A component that renders an Excel/CSV uploader.
 *
 * It reads the first sheet of the uploaded file, converts it to JSON,
 * assigns unique IDs, groups records by their non-identifying fields,
 * fills in missing item numbers, limits a preview slice, and returns
 * the result via props callbacks.
 */
const ExcelUploader: React.FC<ExcelUploaderProps> = ({
  onDataLoad,
  onError,
}) => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  /**
   * Handles the `<input type="file">` change event:
   * 1. Validates file type against XLSX, XLS, or CSV MIME types.
   * 2. Reads file as ArrayBuffer.
   * 3. Parses workbook via `xlsx`.
   * 4. Converts first sheet to JSON; errors if empty.
   * 5. Adds a unique `id` to each record.
   * 6. Groups records by their data payload (excluding `id` and `item_no`).
   * 7. For each group:
   *    a. Determines expected count (`item_count` or group size).
   *    b. Orders existing `item_no` entries and marks used indices.
   *    c. Fills placeholders with missing indices.
   *    d. Inserts entirely missing entries based on base record.
   *    e. Sorts group by `item_no`.
   *    f. Appends up to `PREVIEW_ROW_LIMIT` rows to `preview`.
   *    g. Increments `total` by the group's expected count.
   * 8. Invokes `onDataLoad` with `{ preview, groups, total }`.
   * 9. Clears the file input to allow re-upload of the same file.
   *
   * On any validation or parsing error, invokes `onError` with a translated message.
   */
  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Only allow common spreadsheet types
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
          // Parse the file into an XLSX workbook
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          // Convert sheet to JSON array of records
          const jsonData =
            XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

          if (jsonData.length === 0) {
            onError(t("uploader.errors.emptyFile"));
            return;
          }

          // Attach a unique `id` to each row
          const timestamp = Date.now();
          const dataWithIds = jsonData.map((record, idx) => ({
            id: `record_${timestamp}_${idx + 1}`,
            ...record,
          })) as ExcelRecord[];

          // Group records by their data fields (excluding id and item_no)
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

          const preview: ExcelRecord[] = [];
          let total = 0;

          // Process each group to fill gaps and order items
          groups.forEach((records) => {
            const base = records[0];
            const count = Number(base.item_count) || records.length;

            // Track which item_no values are used
            const used = new Set<number>();
            const placeholders: ExcelRecord[] = [];
            const ordered: ExcelRecord[] = [];

            // First pass: accept valid, unique item_no entries
            records.forEach((rec) => {
              const no = Number(rec.item_no);
              if (
                Number.isInteger(no) &&
                no > 0 &&
                no <= count &&
                !used.has(no)
              ) {
                ordered.push({ ...rec, item_no: no });
                used.add(no);
              } else {
                placeholders.push(rec);
              }
            });

            // Determine which indices are missing
            const missing: number[] = [];
            for (let i = 1; i <= count; i++) {
              if (!used.has(i)) missing.push(i);
            }

            // Assign missing indices to placeholder records
            placeholders.forEach((rec) => {
              if (missing.length === 0) return;
              const no = missing.shift()!;
              ordered.push({ ...rec, item_no: no });
              used.add(no);
            });

            // For any indices still missing, duplicate the base record
            missing.forEach((no) => {
              ordered.push({ ...base, item_no: no });
            });

            // Sort group by item_no ascending
            ordered.sort((a, b) => Number(a.item_no) - Number(b.item_no));

            // Build the preview slice up to the defined limit
            ordered.forEach((row) => {
              if (preview.length < PREVIEW_ROW_LIMIT) {
                preview.push({
                  ...row,
                  id: `${base.id}_${row.item_no}`,
                });
              }
            });

            total += count;
          });

          // Return the prepared data
          onDataLoad({ preview, groups, total });
          // Reset input to allow same file re-selection
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
