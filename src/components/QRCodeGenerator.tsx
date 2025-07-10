import React, { useEffect, useState, useRef } from "react";
import QRCode from "qrcode";
import { ExcelRecord, QRCodeData } from "../types";
import { QrCode, Loader2 } from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";
import { useLanguage } from "../contexts/LanguageContext";
import { formatPair } from "../utils/formatPair";
interface QRCodeGeneratorProps {
  data: ExcelRecord[];
  onQRCodesGenerated: (qrCodes: QRCodeData[]) => void;
}

/**
 * Renders "label: a/b" in LTR, or "label: b/a" in RTL
 * so that `a` ends up on the right side of the slash.
 */

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  data,
  onQRCodesGenerated,
}) => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  const [qrCodes, setQrCodes] = useState<QRCodeData[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentRecord, setCurrentRecord] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [pageSize, setPageSize] = useState(12);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(qrCodes.length / pageSize) || 1;
  const generationStartedRef = useRef<string>("");
  const dataHashRef = useRef<string>("");

  const createDataHash = (records: ExcelRecord[]) =>
    records.map((r) => r.id).join(",");

  useEffect(() => {
    if (data.length === 0) return;

    const currentDataHash = createDataHash(data);
    if (
      currentDataHash === dataHashRef.current &&
      generationStartedRef.current === currentDataHash
    ) {
      return;
    }

    setQrCodes([]);
    setCurrentPage(1);
    setLoading(true);
    setProgress(0);
    setCurrentRecord(0);
    setIsComplete(false);

    generationStartedRef.current = currentDataHash;
    dataHashRef.current = currentDataHash;

    const generateQRCodesBatched = async (records: ExcelRecord[]) => {
      const codes: QRCodeData[] = [];
      const batchSize = 3;

      for (let i = 0; i < records.length; i += batchSize) {
        if (createDataHash(data) !== currentDataHash) {
          return codes;
        }

        const batch = records.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(async (record) => {
            try {
              const qrDataString = Object.keys(record)
                .filter((key) => key !== "id")
                .map((key) => `${key}: ${record[key]}`)
                .join("\n");

              const qrCodeDataUrl = await QRCode.toDataURL(qrDataString, {
                errorCorrectionLevel: "M",
                type: "image/png",
                quality: 0.92,
                margin: 1,
                color: { dark: "#000000", light: "#FFFFFF" },
                width: 256,
              });

              return {
                id: record.id,
                data: qrDataString,
                qrCode: qrCodeDataUrl,
                record,
              } as QRCodeData;
            } catch (error) {
              console.error(
                "Error generating QR code for record:",
                record.id,
                error
              );
              return null;
            }
          })
        );

        batchResults.forEach((r) => r && codes.push(r));

        const completed = Math.min(i + batchSize, records.length);
        setProgress((completed / records.length) * 100);
        setCurrentRecord(completed);
        setQrCodes([...codes]);

        await new Promise((res) => setTimeout(res, 50));
      }

      return codes;
    };

    const generateQRCodes = async () => {
      try {
        const codes = await generateQRCodesBatched(data);
        if (createDataHash(data) === currentDataHash) {
          setQrCodes(codes);
          setCurrentPage(1);
          setIsComplete(true);
          onQRCodesGenerated(codes);
        }
      } catch (error) {
        console.error("Error generating QR codes:", error);
      } finally {
        if (createDataHash(data) === currentDataHash) {
          setLoading(false);
        }
      }
    };

    generateQRCodes();
  }, [data, onQRCodesGenerated]);

  if (data.length === 0) return null;

  return (
    <div
      className={`w-full max-w-6xl mx-auto mt-8 ${isRTL ? "font-arabic" : ""}`}
    >
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
          <h3
            className={`text-xl font-bold text-white flex items-center gap-2 ${
              isRTL ? "flex-row-reverse" : ""
            }`}
          >
            <QrCode className="w-6 h-6" />
            {t("qrGenerator.title")}
          </h3>
        </div>

        <div className="p-6">
          {loading && !isComplete && (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
              <p className="text-gray-600 text-center mb-2">
                {t("qrGenerator.generating", {
                  current: currentRecord.toString(),
                  total: data.length.toString(),
                })}
              </p>
              <div className="w-full bg-gray-200 rounded-full h-3 max-w-md mx-auto mb-2">
                <div
                  className="bg-purple-600 h-3 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 text-center">
                {t("qrGenerator.complete", {
                  count: Math.round(progress).toString(),
                })}
              </p>
            </div>
          )}

          {qrCodes.length > 0 && (
            <>
              <div className="mb-6 text-center">
                <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <p className="text-sm font-medium text-center">
                    {isComplete
                      ? t("qrGenerator.completed")
                      : t("qrGenerator.generatingStatus")}{" "}
                    {t("qrGenerator.qrCodesCount", {
                      generated: qrCodes.length.toString(),
                      total: data.length.toString(),
                    })}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {qrCodes
                  .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                  .map((qrCodeData, index) => {
                    const { record } = qrCodeData;
                    const hasPage = "daftr_no" in record && "page_no" in record;
                    const hasItem =
                      "item_no" in record && "item_count" in record;

                    return (
                      <div
                        key={qrCodeData.id}
                        className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow duration-200"
                      >
                        <div className="text-center">
                          <div className="w-full h-48 flex items-center justify-center mb-3">
                            <img
                              src={qrCodeData.qrCode}
                              alt={`QR Code ${
                                index + 1 + (currentPage - 1) * pageSize
                              }`}
                              className="max-w-full max-h-full object-contain rounded-lg"
                              style={{ imageRendering: "pixelated" }}
                            />
                          </div>

                          {/* flipped pairs here */}
                          {hasPage && (
                            <p className="text-xs text-gray-500 text-center">
                              {formatPair(
                                t("qrGenerator.daftr_no/page_no"),
                                record.daftr_no,
                                record.page_no,
                                isRTL
                              )}
                            </p>
                          )}
                          {hasItem && (
                            <p className="text-xs text-gray-500 text-center">
                              {formatPair(
                                t("qrGenerator.item_no/item_count"),
                                record.item_no,
                                record.item_count,
                                isRTL
                              )}
                            </p>
                          )}

                          {!hasPage && !hasItem && (
                            <>
                              <p className="text-sm font-medium text-gray-700 mb-1 text-center">
                                {t("qrGenerator.recordNumber", {
                                  number: (
                                    index +
                                    1 +
                                    (currentPage - 1) * pageSize
                                  ).toString(),
                                })}
                              </p>
                              <p className="text-xs text-gray-500 truncate text-center">
                                {Object.keys(record)
                                  .filter((key) => key !== "id")
                                  .slice(0, 2)
                                  .map((key) => `${key}: ${record[key]}`)
                                  .join(", ")}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>

              <div
                className={`mt-6 flex items-center justify-between gap-4 ${
                  isRTL ? "flex-row-reverse" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="qr-page-size"
                    className="text-sm text-gray-700"
                  >
                    {t("dataTable.pageSize")}:
                  </label>
                  <select
                    id="qr-page-size"
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(parseInt(e.target.value, 10));
                      setCurrentPage(1);
                    }}
                    className="border-gray-300 rounded p-1 text-sm"
                  >
                    {[12, 24, 48, 96].map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
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
                    onClick={() =>
                      setCurrentPage((p) => Math.min(p + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="px-2 py-1 bg-gray-100 rounded disabled:opacity-50"
                  >
                    &gt;
                  </button>
                </div>
              </div>
            </>
          )}

          {!loading && qrCodes.length === 0 && data.length > 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 text-center">
                {t("qrGenerator.noQRCodes")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRCodeGenerator;
