"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const PANEL =
  "rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] shadow-[0_1px_2px_rgba(15,23,42,0.05),0_4px_16px_-6px_rgba(15,23,42,0.08)]";
export const PANEL_HEAD =
  "flex min-h-[4.25rem] flex-col justify-center border-b border-[color:var(--border)] px-5 py-4";
export const PANEL_BODY = "p-5 sm:p-6";
export const SECTION_ANCHOR =
  "scroll-mt-[calc(var(--app-header-h,104px)+var(--app-crumbs-h,36px)+24px)]";
export const SECTION_TITLE = "text-base font-bold tracking-tight text-[color:var(--foreground)]";
export const SECTION_SUB = "mt-1 truncate text-xs font-medium leading-relaxed text-[color:var(--muted)]";

export function Panel(props: {
  id?: string;
  title: ReactNode;
  sub?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section id={props.id} className={cn(PANEL, SECTION_ANCHOR, props.className)}>
      <div className={PANEL_HEAD}>
        <p className={SECTION_TITLE}>{props.title}</p>
        {props.sub ? <p className={SECTION_SUB}>{props.sub}</p> : null}
      </div>
      <div className={PANEL_BODY}>{props.children}</div>
    </section>
  );
}

