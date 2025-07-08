export interface ExcelRecord {
  id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface QRCodeData {
  id: string;
  data: string;
  qrCode: string;
  record: ExcelRecord;
}