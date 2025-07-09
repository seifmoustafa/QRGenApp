import React, { useState } from "react";
import { jsPDF } from "jspdf";
import fontData from "../fonts/NotoSansArabic";

import { QRCodeData } from "../types";
import { Download, FileText, Loader2 } from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";
import { useLanguage } from "../contexts/LanguageContext";
import { formatArabicText } from "../utils/formatArabicText";

interface PDFExporterProps {
  qrCodes: QRCodeData[];
}

const PDFExporter: React.FC<PDFExporterProps> = ({ qrCodes }) => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const [exporting, setExporting] = useState(false);

  const exportToPDF = async () => {
    if (qrCodes.length === 0) return;

    setExporting(true);

    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const currentDate = new Date();
      const formattedDate = `${currentDate
        .getDate()
        .toString()
        .padStart(2, "0")}/${(currentDate.getMonth() + 1)
        .toString()
        .padStart(2, "0")}/${currentDate.getFullYear()}`;
      // Embed Arabic-supporting font and enable RTL if needed
      pdf.addFileToVFS("NotoSansArabic.ttf", fontData);
      pdf.addFont("NotoSansArabic.ttf", "NotoSansArabic", "normal");
      pdf.setFont("NotoSansArabic");
      // Avoid jsPDF's built-in RTL handling because it reverses Latin text.
      // We already format Arabic segments ourselves so English words should
      // remain in the proper order.
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Configuration for QR codes layout
      const qrSize = 40; // mm
      const margin = 10; // mm
      const spacing = 5; // mm
      const codesPerRow = Math.floor(
        (pageWidth - 2 * margin) / (qrSize + spacing)
      );
      const codesPerColumn = Math.floor(
        (pageHeight - 2 * margin) / (qrSize + spacing + 15)
      ); // +15 for text
      const codesPerPage = codesPerRow * codesPerColumn;

      // Add title to first page
      pdf.setFontSize(16);
      const titleText = isRTL
        ? formatArabicText(t("pdfExporter.title"))
        : t("pdfExporter.title");
      pdf.text(titleText, pageWidth / 2, 20, { align: "center" });
      pdf.setFontSize(10);
      const headerText = isRTL
        ? formatArabicText(
            `${t("common.total")} ${t("common.records")}: ${qrCodes.length}`
          )
        : `${t("common.total")} ${t("common.records")}: ${qrCodes.length}`;
      pdf.text(headerText, pageWidth / 2, 27, { align: "center" });

      for (let i = 0; i < qrCodes.length; i++) {
        const qrCodeData = qrCodes[i];

        // Calculate position on current page
        const pagePosition = i % codesPerPage;
        const row = Math.floor(pagePosition / codesPerRow);
        const col = pagePosition % codesPerRow;

        // Check if we need a new page
        if (i > 0 && pagePosition === 0) {
          pdf.addPage();
        }

        // Calculate x and y positions
        const x = margin + col * (qrSize + spacing);
        const y = margin + 35 + row * (qrSize + spacing + 15); // +35 for header space

        // Convert data URL to format jsPDF can use
        const imgData = qrCodeData.qrCode;

        // Add QR code image
        pdf.addImage(imgData, "PNG", x, y, qrSize, qrSize);

        // Add text below QR code
        let textY = y + qrSize + 5;
        const hasPageDaftr =
          "page_no" in qrCodeData.record && "daftr_no" in qrCodeData.record;
        const hasItemTotal =
          "item_id" in qrCodeData.record && "item_total" in qrCodeData.record;
        const hasSpecial = hasPageDaftr || hasItemTotal;
        pdf.setFontSize(8);

        if (hasSpecial) {
          if (hasPageDaftr) {
            const text = isRTL
              ? formatArabicText(
                  `daftr_no/page_no : ${String(
                    qrCodeData.record.daftr_no
                  )}/${String(qrCodeData.record.page_no)}`
                )
              : `daftr_no/page_no : ${String(
                  qrCodeData.record.daftr_no
                )}/${String(qrCodeData.record.page_no)}`;
            pdf.text(text, x + qrSize / 2, textY, { align: "center" });
            textY += 5;
          }
          if (hasItemTotal) {
            const text = isRTL
              ? formatArabicText(
                  `item_id/item_total : ${String(
                    qrCodeData.record.item_id
                  )}/${String(qrCodeData.record.item_total)}`
                )
              : `item_id/item_total : ${String(
                  qrCodeData.record.item_id
                )}/${String(qrCodeData.record.item_total)}`;
            pdf.text(text, x + qrSize / 2, textY, { align: "center" });
            textY += 5;
          }
        } else {
          const recordNumberText = isRTL
            ? formatArabicText(
                t("qrGenerator.recordNumber", { number: (i + 1).toString() })
              )
            : t("qrGenerator.recordNumber", { number: (i + 1).toString() });
          pdf.text(recordNumberText, x + qrSize / 2, textY, {
            align: "center",
          });
          pdf.setFontSize(6);
          const recordId =
            qrCodeData.record.id.length > 20
              ? qrCodeData.record.id.substring(0, 20) + "..."
              : qrCodeData.record.id;
          const recordIdText = isRTL ? formatArabicText(recordId) : recordId;
          pdf.text(recordIdText, x + qrSize / 2, textY + 5, {
            align: "center",
          });
        }
      }

      // Add footer to all pages
      const totalPages = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        const pageText = isRTL
          ? formatArabicText(
              `${t("common.page")} ${i} ${t("common.of")} ${totalPages}`
            )
          : `${t("common.page")} ${i} ${t("common.of")} ${totalPages}`;
        pdf.text(pageText, pageWidth / 2, pageHeight - 10, { align: "center" });
        const generatedOnText = isRTL
          ? formatArabicText(
              `${t("common.generatedOn")} ${formattedDate}`
            )
          : `${t("common.generatedOn")} ${formattedDate}`;
        pdf.text(generatedOnText, pageWidth - 10, pageHeight - 10, {
          align: "right",
        });
      }

      // Save the PDF
      const filename = t("pdfExporter.filename", {
        date: new Date().toISOString().split("T")[0],
      });
      pdf.save(filename);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert(t("pdfExporter.errors.generateError"));
    } finally {
      setExporting(false);
    }
  };

  if (qrCodes.length === 0) return null;

  return (
    <div
      className={`w-full max-w-4xl mx-auto mt-8 ${isRTL ? "font-arabic" : ""}`}
    >
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-orange-600 to-red-600 px-6 py-4">
          <h3
            className={`text-xl font-bold text-white flex items-center gap-2 ${
              isRTL ? "flex-row-reverse" : ""
            }`}
          >
            <FileText className="w-6 h-6" />
            {t("pdfExporter.title")}
          </h3>
        </div>

        <div className="p-6">
          <div className="text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Download className="w-8 h-8 text-orange-600" />
              </div>
              <h4
                className={`text-lg font-semibold text-gray-800 mb-2 ${
                  isRTL ? "text-center" : "text-center"
                }`}
              >
                {t("pdfExporter.subtitle")}
              </h4>
              <p
                className={`text-gray-600 ${
                  isRTL ? "text-center" : "text-center"
                }`}
              >
                {t("pdfExporter.description", {
                  count: qrCodes.length.toString(),
                })}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <p
                    className={`font-medium text-gray-700 ${
                      isRTL ? "text-center" : "text-center"
                    }`}
                  >
                    {t("pdfExporter.stats.totalQRCodes")}
                  </p>
                  <p className="text-2xl font-bold text-orange-600">
                    {qrCodes.length}
                  </p>
                </div>
                <div className="text-center">
                  <p
                    className={`font-medium text-gray-700 ${
                      isRTL ? "text-center" : "text-center"
                    }`}
                  >
                    {t("pdfExporter.stats.format")}
                  </p>
                  <p
                    className={`text-lg font-semibold text-gray-800 ${
                      isRTL ? "text-center" : "text-center"
                    }`}
                  >
                    {t("pdfExporter.stats.formatValue")}
                  </p>
                </div>
                <div className="text-center">
                  <p
                    className={`font-medium text-gray-700 ${
                      isRTL ? "text-center" : "text-center"
                    }`}
                  >
                    {t("pdfExporter.stats.quality")}
                  </p>
                  <p
                    className={`text-lg font-semibold text-gray-800 ${
                      isRTL ? "text-center" : "text-center"
                    }`}
                  >
                    {t("pdfExporter.stats.qualityValue")}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={exportToPDF}
              disabled={exporting}
              className={`bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-medium flex items-center gap-2 mx-auto transition-colors ${
                isRTL ? "flex-row-reverse" : ""
              }`}
            >
              {exporting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t("pdfExporter.generating")}
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  {t("pdfExporter.exportButton")}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFExporter;
