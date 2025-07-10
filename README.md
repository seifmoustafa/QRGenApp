# QRGenApp

This project is a React application for generating QR codes from Excel files.

## Row expansion

After uploading an Excel file, any record containing an `item_count` column is
automatically duplicated `item_count` times. A new `item_no` field from `1` to
`item_count` is added to each duplicate. The DataTable shows the expanded rows
and provides a **Download Expanded Excel** button to save them.

### Optional CLI script

You can also run the expansion from the command line:

```bash
npm run expand <input.xlsx> [output.xlsx]
```

If `output.xlsx` is omitted, a file named `input_expanded.xlsx` will be created
next to the input file.
