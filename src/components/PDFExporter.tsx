import React, { useState } from "react";
import { jsPDF } from "jspdf";
import fontData from "../fonts/NotoSansArabic";

import { QRCodeData } from "../types";
import { Download, FileText, Loader2 } from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";
import { useLanguage } from "../contexts/LanguageContext";
import { formatArabicText } from "../utils/formatArabicText";
import { formatPair } from "../utils/formatPair";

interface PDFExporterProps {
  /**
   * Array of QR code data objects to include in the exported PDF.
   */
  qrCodes: QRCodeData[];
}

/**
 * PDFExporter
 *
 * Renders controls for configuring QR code size and triggers export of
 * provided QR codes into a formatted multi-page PDF. Handles RTL/LTR
 * layout, Arabic font embedding, dynamic grid calculation, headers,
 * footers, and localized strings.
 */
const PDFExporter: React.FC<PDFExporterProps> = ({ qrCodes }) => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  // Whether the PDF generation is in progress
  const [exporting, setExporting] = useState(false);

  // Mode for selecting QR size: dropdown, numeric input, or slider
  const [qrSizeMode, setQrSizeMode] = useState<"select" | "input" | "slider">(
    "select"
  );
  // Value when using the dropdown selector
  const [qrSizeSelect, setQrSizeSelect] = useState(40);
  // Value when using the numeric input
  const [qrSizeInput, setQrSizeInput] = useState(40);
  // Value when using the slider
  const [qrSizeSlider, setQrSizeSlider] = useState(40);

  // Standard QR size options for the select menu
  const qrSizeOptions = [
    { label: t("pdfExporter.qrSize.verySmall") || "Very Small", value: 20 },
    { label: t("pdfExporter.qrSize.small") || "Small", value: 30 },
    { label: t("pdfExporter.qrSize.medium") || "Medium", value: 40 },
    { label: t("pdfExporter.qrSize.large") || "Large", value: 50 },
    { label: t("pdfExporter.qrSize.veryLarge") || "Very Large", value: 60 },
  ];

  // Determine the active QR size based on the selected mode
  const qrSize =
    qrSizeMode === "select"
      ? qrSizeSelect
      : qrSizeMode === "input"
      ? qrSizeInput
      : qrSizeSlider;

  /**
   * exportToPDF
   *
   * Asynchronously generates a PDF document containing all QR codes with
   * their associated records. It:
   *   1. Initializes a new jsPDF instance with A4 dimensions.
   *   2. Embeds and sets the Arabic font.
   *   3. Calculates dynamic layout parameters (margins, grid size,
   *      text measurements).
   *   4. Renders a localized header with title and record count.
   *   5. Iterates through qrCodes to:
   *      - Add a new page when needed.
   *      - Draw each QR image centered in its cell.
   *      - Render associated text lines (page/item or record info).
   *   6. Draws footers on every page with page numbers and generation date.
   *   7. Saves the PDF using a localized filename.
   * On any error, shows an alert and logs to console.
   */
  const exportToPDF = async () => {
    if (qrCodes.length === 0) return;
    setExporting(true);

    try {
      // 1. Initialize PDF
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // 2. Embed Arabic font
      pdf.addFileToVFS("NotoSansArabic.ttf", fontData);
      pdf.addFont("NotoSansArabic.ttf", "NotoSansArabic", "normal");
      pdf.setFont("NotoSansArabic");

      // Layout constants
      const margin = 10;
      const minSpacing = 5;
      const vertSpacing = 5;

      // Dynamic font size relative to qrSize
      const fontSize = Math.max(2, Math.round(qrSize * 0.3));
      pdf.setFontSize(fontSize);
      const lineHeight = Math.round(fontSize * 1.2);
      const textSpacing = Math.max(2, Math.round(qrSize * 0.15));

      // 3. Measure text widths per record to determine cell width
      const recordWidths = qrCodes.map((qrData, idx) => {
        const { record } = qrData;
        const hasPage = "daftr_no" in record && "page_no" in record;
        const hasItem = "item_no" in record && "item_count" in record;

        const lines: string[] = [];
        if (hasPage) {
          lines.push(
            formatPair(
              t("qrGenerator.daftr_no/page_no"),
              record.daftr_no,
              record.page_no,
              isRTL
            )
          );
        }
        if (hasItem) {
          lines.push(
            formatPair(
              t("qrGenerator.item_no/item_count"),
              record.item_no,
              record.item_count,
              isRTL
            )
          );
        }
        if (!hasPage && !hasItem) {
          lines.push(
            t("qrGenerator.recordNumber", { number: (idx + 1).toString() })
          );
          const idText =
            record.id.length > 20
              ? record.id.substring(0, 20) + "..."
              : record.id;
          lines.push(idText);
        }

        const maxLine = Math.max(
          ...lines.map((ln) =>
            pdf.getTextWidth(isRTL ? formatArabicText(ln) : ln)
          )
        );
        return Math.max(qrSize, maxLine);
      });

      // Top margin just below header
      const headerBottomY = 27;
      const safeMarginTop = 12;
      const dynamicTopMargin = headerBottomY + safeMarginTop;

      // 4. Determine grid cell width and counts
      const cellWidth = Math.max(...recordWidths, qrSize);
      let codesPerRow = Math.floor(
        (pageWidth - 2 * margin + minSpacing) / (cellWidth + minSpacing)
      );
      codesPerRow = Math.max(1, codesPerRow);
      const totalGridWidth =
        codesPerRow * cellWidth + (codesPerRow - 1) * minSpacing;
      const gridStartX = (pageWidth - totalGridWidth) / 2;
      const horizSpacing = codesPerRow > 1 ? minSpacing : 0;
      const footerHeight = 10;
      const safeMarginBottom = 12;
      const bottomMargin = footerHeight + safeMarginBottom;
      const codesPerColumn = Math.floor(
        (pageHeight - dynamicTopMargin - bottomMargin) /
          (qrSize + vertSpacing + lineHeight * 2.2)
      );
      const codesPerPage = codesPerRow * codesPerColumn;

      // 5. Render header on first page
      pdf.setFontSize(Math.max(14, fontSize + 6));
      const title = isRTL
        ? formatArabicText(t("pdfExporter.title"))
        : t("pdfExporter.title");
      pdf.text(title, pageWidth / 2, 20, { align: "center" });

      pdf.setFontSize(Math.max(10, fontSize + 2));
      const header = `${t("pdfExporter.totalRecords")}: ${qrCodes.length}`;
      pdf.text(isRTL ? formatArabicText(header) : header, pageWidth / 2, 27, {
        align: "center",
      });

      // 6. Iterate and draw each QR + its labels
      pdf.setFontSize(fontSize);
      for (let i = 0; i < qrCodes.length; i++) {
        const qrData = qrCodes[i];
        const pagePos = i % codesPerPage;
        const row = Math.floor(pagePos / codesPerRow);
        const col = pagePos % codesPerRow;
        if (pagePos === 0 && i > 0) pdf.addPage();

        const x = gridStartX + col * (cellWidth + horizSpacing);
        const y =
          margin +
          dynamicTopMargin +
          row * (qrSize + vertSpacing + lineHeight * 2.2);

        // Draw the QR image centered
        pdf.addImage(
          qrData.qrCode,
          "PNG",
          x + (cellWidth - qrSize) / 2,
          y,
          qrSize,
          qrSize
        );

        // Draw associated text lines below the QR
        let textY = y + qrSize + textSpacing;
        const { record } = qrData;
        const hasPage = "daftr_no" in record && "page_no" in record;
        const hasItem = "item_no" in record && "item_count" in record;

        if (hasPage) {
          const line = formatPair(
            t("qrGenerator.daftr_no/page_no"),
            record.daftr_no,
            record.page_no,
            isRTL
          );
          pdf.text(
            isRTL ? formatArabicText(line) : line,
            x + cellWidth / 2,
            textY,
            { align: "center" }
          );
          textY += lineHeight;
        }

        if (hasItem) {
          const line = formatPair(
            t("qrGenerator.item_no/item_count"),
            record.item_no,
            record.item_count,
            isRTL
          );
          pdf.text(
            isRTL ? formatArabicText(line) : line,
            x + cellWidth / 2,
            textY,
            { align: "center" }
          );
          textY += lineHeight;
        }

        if (!hasPage && !hasItem) {
          const recNo = t("qrGenerator.recordNumber", {
            number: (i + 1).toString(),
          });
          pdf.text(
            isRTL ? formatArabicText(recNo) : recNo,
            x + cellWidth / 2,
            textY,
            { align: "center" }
          );
          textY += lineHeight;
          const rid =
            record.id.length > 20
              ? record.id.substring(0, 20) + "..."
              : record.id;
          pdf.text(
            isRTL ? formatArabicText(rid) : rid,
            x + cellWidth / 2,
            textY,
            { align: "center" }
          );
        }
      }

      // 7. Render footer on every page
      const totalPages = pdf.internal.pages.length;
      const now = new Date();
      const dateStr = `${now.getDate().toString().padStart(2, "0")}/${(
        now.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}/${now.getFullYear()}`;

      for (let p = 1; p <= totalPages; p++) {
        pdf.setPage(p);
        pdf.setFontSize(8);
        const pageText = `${t("common.page")} ${p} ${t(
          "common.of"
        )} ${totalPages}`;
        pdf.text(
          isRTL ? formatArabicText(pageText) : pageText,
          pageWidth / 2,
          pageHeight - 10,
          { align: "center" }
        );
        const genText = `${t("common.generatedOn")} ${dateStr}`;
        pdf.text(
          isRTL ? formatArabicText(genText) : genText,
          pageWidth - margin,
          pageHeight - 10,
          { align: "right" }
        );
      }

      // 8. Save PDF with localized filename
      const filename = t("pdfExporter.filename", {
        date: now.toISOString().split("T")[0],
      });
      pdf.save(filename);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert(t("pdfExporter.errors.generateError"));
    } finally {
      setExporting(false);
    }
  };

  // Don't render anything if there's no data
  if (qrCodes.length === 0) return null;

  return (
    <div
      className={`w-full max-w-4xl mx-auto mt-8 ${isRTL ? "font-arabic" : ""}`}
    >
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Header */}
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

        {/* Body */}
        <div className="p-6">
          <div className="text-center">
            {/* Intro */}
            <div className="mb-6">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Download className="w-8 h-8 text-orange-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">
                {t("pdfExporter.subtitle")}
              </h4>
              <p className="text-gray-600">
                {t("pdfExporter.description", {
                  count: qrCodes.length.toString(),
                })}
              </p>
            </div>

            {/* QR Size Selection */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="mb-2 font-medium text-gray-700">
                {t("pdfExporter.qrSize.label") || "QR Code Size"}
              </div>
              <div className="flex flex-wrap gap-4 items-center justify-center mb-4">
                {/* Mode Radios */}
                {["select", "input", "slider"].map((mode) => (
                  <label key={mode} className="flex items-center gap-1">
                    <input
                      type="radio"
                      name="qrSizeMode"
                      value={mode}
                      checked={qrSizeMode === mode}
                      onChange={() =>
                        setQrSizeMode(mode as "select" | "input" | "slider")
                      }
                    />
                    {t(`pdfExporter.qrSize.${mode}`) || mode}
                  </label>
                ))}
              </div>

              {/* Mode-specific controls */}
              {qrSizeMode === "select" && (
                <select
                  className="border rounded px-3 py-1"
                  value={qrSizeSelect}
                  onChange={(e) => setQrSizeSelect(Number(e.target.value))}
                >
                  {qrSizeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} ({opt.value}mm)
                    </option>
                  ))}
                </select>
              )}
              {qrSizeMode === "input" && (
                <input
                  type="number"
                  min={10}
                  max={100}
                  step={1}
                  className="border rounded px-3 py-1"
                  value={qrSizeInput}
                  onChange={(e) => setQrSizeInput(Number(e.target.value))}
                />
              )}
              {qrSizeMode === "slider" && (
                <input
                  type="range"
                  min={10}
                  max={100}
                  step={1}
                  className="w-64"
                  value={qrSizeSlider}
                  onChange={(e) => setQrSizeSlider(Number(e.target.value))}
                />
              )}

              {/* Display current value */}
              <div className="mt-2 text-sm text-gray-600">
                {t("pdfExporter.qrSize.current") || "Current size"}:{" "}
                <span className="font-bold">{qrSize}mm</span>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <p className="font-medium text-gray-700">
                    {t("pdfExporter.stats.totalQRCodes")}
                  </p>
                  <p className="text-2xl font-bold text-orange-600">
                    {qrCodes.length}
                  </p>
                </div>
                <div className="text-center">
                  <p className="font-medium text-gray-700">
                    {t("pdfExporter.stats.format")}
                  </p>
                  <p className="text-lg font-semibold text-gray-800">
                    {t("pdfExporter.stats.formatValue")}
                  </p>
                </div>
                <div className="text-center">
                  <p className="font-medium text-gray-700">
                    {t("pdfExporter.stats.quality")}
                  </p>
                  <p className="text-lg font-semibold text-gray-800">
                    {t("pdfExporter.stats.qualityValue")}
                  </p>
                </div>
              </div>
            </div>

            {/* Export Button */}
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
