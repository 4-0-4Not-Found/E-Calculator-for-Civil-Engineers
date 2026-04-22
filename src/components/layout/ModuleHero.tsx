"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ModuleHeroChip = { key: string; label: ReactNode };

const META_CHIP =
  "inline-flex h-8 items-center rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-2)] px-2.5 text-[11px] font-semibold text-[color:var(--foreground)]/80 shadow-sm";

export function ModuleHero(props: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  chips?: ModuleHeroChip[];
  image?: { src: string; alt?: string };
  right?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-3xl border border-[color:var(--border)] bg-[color:var(--zone-hero)] px-6 py-8 shadow-[var(--shadow-sm)] sm:px-10 sm:py-10",
        props.className,
      )}
    >
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          {props.eyebrow ? (
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
              {props.eyebrow}
            </p>
          ) : null}

          <h1 className="mt-3 text-[34px] font-extrabold leading-[0.98] tracking-tight text-[color:var(--foreground)] sm:text-[44px]">
            <span className="bg-gradient-to-r from-[color:var(--heading-grad-from)] to-[color:var(--heading-grad-to)] bg-clip-text text-transparent">
              {props.title}
            </span>
          </h1>

          {props.description ? (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[color:var(--muted)]">{props.description}</p>
          ) : null}

          {props.chips?.length ? (
            <div className="mt-5 flex flex-wrap items-center gap-2">
              {props.chips.map((c) => (
                <span key={c.key} className={META_CHIP}>
                  {c.label}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex w-full flex-col items-stretch gap-3 md:w-auto md:max-w-[380px] md:items-end">
          {props.right ? <div className="flex w-full flex-wrap items-center justify-start gap-2 md:justify-end">{props.right}</div> : null}
          {props.image ? (
            <div className="w-full">
              <div className="relative overflow-hidden rounded-2xl border border-white/80 bg-white p-4 shadow-sm" aria-hidden="true">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent to-[color:var(--mint)]/55" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={props.image.src}
                  alt={props.image.alt ?? ""}
                  className="relative z-[1] mx-auto h-36 w-auto max-w-full object-contain sm:h-40 md:h-44"
                  draggable={false}
                  decoding="async"
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

