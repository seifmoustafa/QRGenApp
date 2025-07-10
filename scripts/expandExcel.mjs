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
  const expanded = [];

  for (const row of rows) {
    const count = Number(row.item_count) || 0;
    for (let i = 1; i <= count; i++) {
      expanded.push({
        ...row,
        item_no: i,
      });
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
