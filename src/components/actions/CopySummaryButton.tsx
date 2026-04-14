"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export function CopySummaryButton(props: { getText: () => string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(props.getText());
          setCopied(true);
          window.setTimeout(() => setCopied(false), 900);
          toast.push({ title: "Copied", message: "Summary copied to clipboard.", tone: "good" });
        } catch {
          toast.push({ title: "Copy failed", message: "Clipboard permission blocked.", tone: "bad" });
          /* ignore */
        }
      }}
    >
      {copied ? "Copied" : props.label ?? "Copy summary"}
    </Button>
  );
}

