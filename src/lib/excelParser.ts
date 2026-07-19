import * as XLSX from 'xlsx';

export const parseExcel = (buffer: Buffer) => {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Read as array of arrays to handle duplicate headers manually
  const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });
  if (rows.length === 0) return [];

  const rawHeaders = rows[0];
  const dataRows = rows.slice(1);

  // Rename duplicate headers by adding _1, _2, etc.
  const processedHeaders: string[] = [];
  const counts: Record<string, number> = {};

  rawHeaders.forEach((h) => {
    const header = String(h || '').trim();
    if (!header) {
      processedHeaders.push(`EMPTY_${Math.random()}`);
      return;
    }
    
    if (counts[header] === undefined) {
      counts[header] = 0;
      processedHeaders.push(header);
    } else {
      counts[header]++;
      processedHeaders.push(`${header}_${counts[header]}`);
    }
  });

  // Convert rows to objects using the unique headers
  return dataRows.map((row) => {
    const obj: any = {};
    processedHeaders.forEach((header, index) => {
      obj[header] = row[index] !== undefined ? row[index] : null;
    });
    return obj;
  });
};
