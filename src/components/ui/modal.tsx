"use client";

import { useEffect, useMemo, useRef } from "react";

function getFocusable(root: HTMLElement, selector: string) {
  return Array.from(root.querySelectorAll<HTMLElement>(selector)).filter(
    (el) => !el.hasAttribute("disabled") && el.tabIndex !== -1,
  );
}

export function useModalA11y(opts: {
  open: boolean;
  onClose: () => void;
  /** Element that should receive initial focus when opened. */
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  /** Container that bounds focus. */
  containerRef: React.RefObject<HTMLElement | null>;
}) {
  const { open, onClose, initialFocusRef, containerRef } = opts;
  const lastActiveRef = useRef<HTMLElement | null>(null);

  const focusableSelector = useMemo(
    () =>
      [
        'button:not([disabled])',
        '[href]',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(","),
    [],
  );

  useEffect(() => {
    if (!open) return;

    lastActiveRef.current = (document.activeElement as HTMLElement | null) ?? null;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    queueMicrotask(() => {
      initialFocusRef?.current?.focus?.();
    });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const root = containerRef.current;
      if (!root) return;

      const nodes = getFocusable(root, focusableSelector);
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = (document.activeElement as HTMLElement | null) ?? null;

      if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && (active === first || active === root)) {
        e.preventDefault();
        last.focus();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose, containerRef, initialFocusRef, focusableSelector]);

  useEffect(() => {
    if (open) return;
    try {
      lastActiveRef.current?.focus?.();
    } catch {
      /* ignore */
    } finally {
      lastActiveRef.current = null;
    }
  }, [open]);
}

export const modalOverlayClass =
  "absolute inset-0 bg-slate-950/40 backdrop-blur-[3px]";

export const modalPanelClass =
  "relative w-full rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] shadow-[var(--shadow)] ring-1 ring-slate-950/5";

export const modalHeaderClass =
  "flex items-start justify-between gap-3 border-b border-[color:var(--border)]/35 bg-[color:var(--surface)]/75 p-4 backdrop-blur";

export const modalTitleClass =
  "text-base font-extrabold tracking-tight text-slate-950";

export const modalSubtitleClass =
  "mt-1 text-xs font-medium leading-relaxed text-[color:var(--muted)]";

