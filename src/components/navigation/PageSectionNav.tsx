"use client";

import { UI } from "@/lib/ui/strings";
import { cn } from "@/lib/utils";

/**
 * In-page anchor links to section ids (e.g. PersistedDetails with matching `id` on `<details>`).
 */
export function PageSectionNav(props: {
  sections: { id: string; label: string }[];
  className?: string;
}) {
  if (props.sections.length === 0) return null;

  return (
    <nav aria-label={UI.pageOnThisPage} className={cn("not-print", props.className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
        <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {UI.pageOnThisPage}
        </span>
        <ul className="flex min-w-0 flex-wrap gap-2">
          {props.sections.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-[#0818A8]/35 hover:bg-[#0818A8]/5 hover:text-[#0818A8] dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-500/40 dark:hover:bg-slate-800"
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
