"use client";

import { Button } from "@/components/ui/Button";

export function RetryReloadButton(props: { label?: string }) {
  return (
    <Button
      variant="secondary"
      size="sm"
      type="button"
      onClick={() => {
        try {
          window.location.reload();
        } catch {
          /* ignore */
        }
      }}
    >
      {props.label ?? "Retry"}
    </Button>
  );
}

