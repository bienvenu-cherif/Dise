import { Workbook } from 'exceljs';

type ExcelRow = Record<string, unknown>;

export async function rowsToXlsxBuffer(rows: ExcelRow[], sheetName: string): Promise<Buffer> {
  const workbook = new Workbook();
  const worksheet = workbook.addWorksheet(sheetName);
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  worksheet.columns = columns.map((column) => ({
    header: column,
    key: column,
    width: Math.min(42, Math.max(14, column.length + 4)),
  }));

  rows.forEach((row) => worksheet.addRow(row));
  worksheet.getRow(1).font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer as ArrayBuffer);
}

export async function xlsxBufferToRows(buffer: Buffer): Promise<ExcelRow[]> {
  const workbook = new Workbook();
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    return [];
  }

  const headers: string[] = [];
  worksheet.getRow(1).eachCell((cell, columnNumber) => {
    headers[columnNumber] = String(cell.value ?? '').trim();
  });

  const rows: ExcelRow[] = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      return;
    }

    const record: ExcelRow = {};
    headers.forEach((header, columnNumber) => {
      if (!header) {
        return;
      }
      record[header] = normalizeCellValue(row.getCell(columnNumber).value);
    });
    rows.push(record);
  });

  return rows;
}

function normalizeCellValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return '';
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value !== 'object') {
    return value;
  }

  const cellObject = value as { text?: string; result?: unknown; richText?: Array<{ text?: string }> };
  if (cellObject.text !== undefined) {
    return cellObject.text;
  }
  if (cellObject.result !== undefined) {
    return cellObject.result;
  }
  if (Array.isArray(cellObject.richText)) {
    return cellObject.richText.map((part) => part.text ?? '').join('');
  }

  return String(value);
}
