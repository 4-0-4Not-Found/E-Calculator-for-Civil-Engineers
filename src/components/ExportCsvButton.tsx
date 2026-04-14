"use client";

import { downloadCsv, rowsToCsv } from "@/lib/utils/csv";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

type Props = {
  filename: string;
  rows: string[][];
  label?: string;
};

/** Downloads an Excel-compatible CSV file. */
export function ExportCsvButton(props: Props) {
  const toast = useToast();
  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={() => {
        downloadCsv(props.filename, rowsToCsv(props.rows));
        toast.push({ title: "Download started", message: props.filename, tone: "info" });
      }}
    >
      {props.label ?? "Download CSV (Excel)"}
    </Button>
  );
}
