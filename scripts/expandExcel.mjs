import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

const EXCEL_ROW_LIMIT = 1_048_576;

const [,, inputFile, outputFileArg] = process.argv;
if (!inputFile) {
  console.error('Usage: node scripts/expandExcel.mjs <input.xlsx> [output.xlsx]');
  process.exit(1);
}

const outputFile = outputFileArg || path.join(
  path.dirname(inputFile),
  path.basename(inputFile, path.extname(inputFile)) + '_expanded.xlsx'
);

try {
  const workbook = XLSX.readFile(inputFile);
  const sheetName = workbook.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

  const groups = new Map();

  // Group rows ignoring the item_no column
  for (const row of rows) {
    const key = JSON.stringify(
      Object.fromEntries(
        Object.entries(row).filter(([k]) => k !== 'item_no')
      )
    );
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(row);
  }

  let expandedChunk = [];
  let part = 1;

  const flushChunk = () => {
    if (expandedChunk.length === 0) return;
    const outWb = XLSX.utils.book_new();
    const outSheet = XLSX.utils.json_to_sheet(expandedChunk);
    XLSX.utils.book_append_sheet(outWb, outSheet, 'Sheet1');
    const suffix = part > 1 ? `_part${part}` : '';
    const baseName = outputFile.replace(/\.xlsx$/i, '');
    const fileName = part === 1 && !fs.existsSync(outputFile) && suffix === ''
      ? outputFile
      : `${baseName}${suffix}.xlsx`;
    XLSX.writeFile(outWb, fileName);
    console.log(`Expanded file written to ${fileName}`);
    expandedChunk = [];
    part += 1;
  };

  for (const records of groups.values()) {
    const base = records[0];
    const count = Number(base.item_count) || records.length;

    const used = new Set();
    const placeholders = [];
    const ordered = [];

    for (const record of records) {
      const no = Number(record.item_no);
      if (Number.isInteger(no) && no > 0 && no <= count && !used.has(no)) {
        ordered.push({ ...record, item_no: no });
        used.add(no);
      } else {
        placeholders.push(record);
      }
    }

    const missing = [];
    for (let i = 1; i <= count; i++) {
      if (!used.has(i)) missing.push(i);
    }

    for (const record of placeholders) {
      if (missing.length === 0) break;
      const no = missing.shift();
      ordered.push({ ...record, item_no: no });
      used.add(no);
    }

    for (const no of missing) {
      ordered.push({ ...base, item_no: no });
    }

    ordered.sort((a, b) => Number(a.item_no) - Number(b.item_no));
    for (const row of ordered) {
      expandedChunk.push(row);
      if (expandedChunk.length >= EXCEL_ROW_LIMIT) {
        flushChunk();
      }
    }
  }
  flushChunk();
} catch (err) {
  console.error('Failed to process file:', err);
  process.exit(1);
}
