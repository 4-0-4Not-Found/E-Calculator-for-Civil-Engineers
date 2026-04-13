"use client";

import { downloadCsv, rowsToCsv } from "@/lib/utils/csv";

type Props = {
  filename: string;
  rows: string[][];
  label?: string;
};

/** Downloads an Excel-compatible CSV file. */
export function ExportCsvButton(props: Props) {
  return (
    <button
      type="button"
      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:border-slate-300 hover:bg-slate-50"
      onClick={() => {
        downloadCsv(props.filename, rowsToCsv(props.rows));
      }}
    >
      {props.label ?? "Download CSV (Excel)"}
    </button>
  );
}
