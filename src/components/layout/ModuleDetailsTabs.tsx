"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type DetailsTab<T extends string> = {
  id: T;
  label: string;
  panel: ReactNode;
};

export function ModuleDetailsTabs<T extends string>(props: {
  title: string;
  description?: string;
  tabs: Array<DetailsTab<T>>;
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <section className={cn("space-y-4", props.className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-2xl font-extrabold tracking-tight text-[color:var(--accent)]">{props.title}</p>
          {props.description ? <p className="mt-1 text-sm text-[color:var(--muted)]">{props.description}</p> : null}
        </div>
        <div
          role="tablist"
          aria-label={`${props.title} tabs`}
          className="inline-flex w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)]/75 p-1 shadow-sm backdrop-blur sm:w-auto"
          onKeyDown={(e) => {
            if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
            e.preventDefault();
            const idx = props.tabs.findIndex((t) => t.id === props.value);
            if (idx < 0) return;
            const next = e.key === "ArrowRight" ? (idx + 1) % props.tabs.length : (idx - 1 + props.tabs.length) % props.tabs.length;
            props.onChange(props.tabs[next]!.id);
          }}
        >
          {props.tabs.map((t) => {
            const active = props.value === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active ? "true" : "false"}
                onClick={() => props.onChange(t.id)}
                className={[
                  "min-h-10 flex-1 rounded-2xl px-4 text-sm font-semibold transition sm:flex-none focus-visible:outline-none",
                  active
                    ? "bg-[color:var(--mint)] text-[color:var(--accent)] shadow-sm"
                    : "text-[color:var(--muted)] hover:bg-[color:var(--surface-2)]",
                ].join(" ")}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div role="tabpanel" className="space-y-6">
        {props.tabs.find((t) => t.id === props.value)?.panel ?? null}
      </div>
    </section>
  );
}

