export interface ExcelRecord {
  id: string;
  [key: string]: any;
}

export interface QRCodeData {
  id: string;
  data: string;
  qrCode: string;
  record: ExcelRecord;
}