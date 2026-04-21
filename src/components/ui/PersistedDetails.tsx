"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { CLIENT_PERSISTENCE } from "@/lib/client-persistence";

function storageKey(id: string) {
  return CLIENT_PERSISTENCE.uiDetails(id);
}

/**
 * Remembers open/closed state in localStorage (UI only). Controlled `<details open>` so SSR and client match `defaultOpen`, then localStorage can adjust after mount.
 */
export function PersistedDetails(props: {
  id: string;
  summary: ReactNode;
  children: ReactNode;
  className?: string;
  defaultOpen?: boolean;
}) {
  const defaultOpen = props.defaultOpen ?? true;
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const raw = localStorage.getItem(storageKey(props.id));
        if (raw === "0") setOpen(false);
        else if (raw === "1") setOpen(true);
      } catch {
        /* ignore */
      }
    });
  }, [props.id]);

  return (
    <details
      id={props.id}
      className={cn(
        "scroll-mt-24 rounded-2xl border border-slate-200 bg-white md:scroll-mt-28 dark:border-slate-700 dark:bg-slate-900",
        props.className,
      )}
      open={open}
      onToggle={(e) => {
        const v = e.currentTarget.open;
        setOpen(v);
        try {
          localStorage.setItem(storageKey(props.id), v ? "1" : "0");
        } catch {
          /* ignore */
        }
      }}
    >
      {props.summary}
      {props.children}
    </details>
  );
}
