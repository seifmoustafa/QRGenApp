import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

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

  const expanded = [];

  for (const records of groups.values()) {
    const base = records[0];
    const count = Number(base.item_count) || records.length;

    // Keep existing records as-is
    expanded.push(...records);

    if (records.length < count) {
      const existingNos = records
        .map((r) => Number(r.item_no))
        .filter((n) => !Number.isNaN(n));

      const missingNos = [];
      for (let i = 1; i <= count; i++) {
        if (!existingNos.includes(i)) {
          missingNos.push(i);
        }
      }

      for (const no of missingNos) {
        expanded.push({
          ...base,
          item_no: no,
        });
      }
    }
  }

  const outWb = XLSX.utils.book_new();
  const outSheet = XLSX.utils.json_to_sheet(expanded);
  XLSX.utils.book_append_sheet(outWb, outSheet, 'Sheet1');
  XLSX.writeFile(outWb, outputFile);
  console.log(`Expanded file written to ${outputFile}`);
} catch (err) {
  console.error('Failed to process file:', err);
  process.exit(1);
}
