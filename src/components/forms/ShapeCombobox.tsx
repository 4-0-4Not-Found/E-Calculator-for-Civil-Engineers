"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Opt = { value: string; label?: string };

/**
 * Searchable, virtualized shape picker — UI only; parent owns value and onChange.
 * Use when option count is large (e.g. AISC shape lists).
 */
export function ShapeCombobox(props: {
  value: string;
  onChange: (value: string) => void;
  options: Opt[];
  id?: string;
  placeholder?: string;
  "aria-label"?: string;
}) {
  const autoId = useId();
  const listId = `${autoId}-listbox`;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const parentRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return props.options;
    return props.options.filter((o) => o.value.toLowerCase().includes(q));
  }, [props.options, query]);

  // TanStack Virtual returns unstable function refs; React Compiler skips memoization here (safe for this leaf UI).
  // eslint-disable-next-line react-hooks/incompatible-library -- useVirtualizer is UI-only; options list is stable enough per open session
  const rowVirtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 36,
    overscan: 12,
  });

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const selectedLabel = props.options.find((o) => o.value === props.value)?.value ?? props.value;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        id={props.id}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={props["aria-label"] ?? "Select shape"}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-base font-semibold text-black shadow-sm outline-none focus:border-[#0818A8]/40 focus:ring-4 focus:ring-[#0818A8]/10 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100",
        )}
      >
        <span className="min-w-0 truncate">{selectedLabel || (props.placeholder ?? "Select…")}</span>
        <span className="shrink-0 text-slate-500" aria-hidden="true">
          ▾
        </span>
      </button>

      {open ? (
        <div
          className="absolute left-0 right-0 z-50 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-600 dark:bg-slate-900"
          role="listbox"
          id={listId}
        >
          <div className="border-b border-slate-100 p-2 dark:border-slate-700">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter shapes…"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-[#0818A8]/40 focus:ring-2 focus:ring-[#0818A8]/10 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              autoComplete="off"
              aria-label="Filter shapes"
            />
          </div>
          <div ref={parentRef} className="max-h-72 overflow-auto py-1">
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: "100%",
                position: "relative",
              }}
            >
              {rowVirtualizer.getVirtualItems().map((vi) => {
                const o = filtered[vi.index];
                if (!o) return null;
                const active = o.value === props.value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    role="option"
                    aria-selected={active}
                    className={cn(
                      "absolute left-0 top-0 w-full px-3 py-2 text-left text-sm font-medium",
                      active
                        ? "bg-[#0818A8]/10 text-[#0818A8] dark:bg-blue-900/40 dark:text-blue-200"
                        : "text-slate-800 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800",
                    )}
                    style={{
                      height: `${vi.size}px`,
                      transform: `translateY(${vi.start}px)`,
                    }}
                    onClick={() => {
                      props.onChange(o.value);
                      setOpen(false);
                      setQuery("");
                    }}
                  >
                    {o.label ?? o.value}
                  </button>
                );
              })}
            </div>
          </div>
          {filtered.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-slate-500">No matches.</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
