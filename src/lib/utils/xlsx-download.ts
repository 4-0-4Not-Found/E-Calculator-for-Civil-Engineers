import * as XLSX from "xlsx";

export type XlsxSheetInput = { name: string; rows: (string | number | undefined)[][] };

/** Excel disallows : \ / ? * [ ] in sheet names; max length 31. */
export function sanitizeExcelSheetName(name: string): string {
  const cleaned = name.replace(/[:\\/?*[\]]/g, "_").trim();
  return (cleaned || "Sheet").slice(0, 31);
}

/** Build a workbook and trigger browser download (client-only). */
export function downloadXlsx(filename: string, sheets: XlsxSheetInput[]) {
  if (!sheets.length) return;
  const wb = XLSX.utils.book_new();
  for (const s of sheets) {
    const rows = s.rows.map((row) => row.map((c) => (c === undefined ? "" : c)));
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, sanitizeExcelSheetName(s.name));
  }
  const base = filename.toLowerCase().endsWith(".xlsx") ? filename : `${filename}.xlsx`;
  XLSX.writeFile(wb, base);
}
