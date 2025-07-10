# QRGenApp

This project is a React application for generating QR codes from Excel files.

## Expanding Excel rows

A helper script is provided to expand rows based on an `item_count` column.
Each row is duplicated `item_count` times and a new `item_no` column is added
with values from `1` to `item_count`.

### Usage

```bash
npm run expand <input.xlsx> [output.xlsx]
```

If `output.xlsx` is omitted, a file named `input_expanded.xlsx` will be
created in the same directory as the input file.
