"use client";

import { downloadXlsx, type XlsxSheetInput } from "@/lib/utils/xlsx-download";

type Props = {
  filename: string;
  sheets: XlsxSheetInput[];
  label?: string;
};

/** Downloads a real .xlsx workbook (opens in Excel, LibreOffice, etc.). */
export function ExportXlsxButton(props: Props) {
  return (
    <button
      type="button"
      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-500 dark:hover:bg-slate-800"
      onClick={() => downloadXlsx(props.filename, props.sheets)}
    >
      {props.label ?? "Download Excel (.xlsx)"}
    </button>
  );
}
