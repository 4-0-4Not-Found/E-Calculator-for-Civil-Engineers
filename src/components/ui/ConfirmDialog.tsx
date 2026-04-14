"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

function WarningIcon(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
      aria-hidden
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  );
}

/**
 * Accessible in-app confirm dialog (replaces `window.confirm` for styled flows).
 */
export function ConfirmDialog(props: {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  /** Strong red styling for the confirm action */
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { open, title, description, confirmLabel, cancelLabel: cancelLabelProp, destructive, onConfirm, onCancel } = props;
  const titleId = useId();
  const descId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    queueMicrotask(() => cancelRef.current?.focus());
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  const cancelLabel = cancelLabelProp ?? "Cancel";

  return (
    <div className="not-print fixed inset-0 z-[95] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
        aria-label="Dismiss dialog"
        onClick={onCancel}
      />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className={cn(
          "relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl",
          "dark:border-slate-700 dark:bg-slate-900",
        )}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div
            className="mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 sm:mx-0"
            aria-hidden
          >
            <WarningIcon className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <h2 id={titleId} className="text-lg font-extrabold tracking-tight text-slate-950 dark:text-slate-50">
              {title}
            </h2>
            <div
              id={descId}
              className="mt-2 space-y-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300"
            >
              {description}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
          <Button ref={cancelRef} type="button" variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={destructive ? "danger" : "primary"}
            onClick={onConfirm}
            className={
              destructive
                ? "border-0 bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500/30 dark:bg-red-600 dark:hover:bg-red-700"
                : undefined
            }
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
