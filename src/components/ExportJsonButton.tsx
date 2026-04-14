"use client";

import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

type Props = {
  data: unknown;
  label?: string;
};

/** Copies a JSON snapshot of results to the clipboard for reports / checking. */
export function ExportJsonButton(props: Props) {
  const toast = useToast();
  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={async () => {
        try {
          const text = JSON.stringify(props.data, null, 2);
          await navigator.clipboard.writeText(text);
          toast.push({ title: "Copied", message: "Results JSON copied to clipboard.", tone: "good" });
        } catch {
          toast.push({ title: "Copy failed", message: "Clipboard permission blocked.", tone: "bad" });
          /* ignore */
        }
      }}
    >
      {props.label ?? "Copy results (JSON)"}
    </Button>
  );
}
