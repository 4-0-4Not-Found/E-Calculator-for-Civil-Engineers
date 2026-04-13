"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function CopySummaryButton(props: { getText: () => string; label?: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(props.getText());
          setCopied(true);
          window.setTimeout(() => setCopied(false), 900);
        } catch {
          /* ignore */
        }
      }}
    >
      {copied ? "Copied" : props.label ?? "Copy summary"}
    </Button>
  );
}

