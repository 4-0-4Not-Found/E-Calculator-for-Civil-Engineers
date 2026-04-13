"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export type CompareSnapshot = {
  ts: number;
  title: string;
  lines: string[];
};

function readPinned(storageKey: string): CompareSnapshot | null {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CompareSnapshot;
    if (!parsed || typeof parsed !== "object") return null;
    if (typeof parsed.ts !== "number") return null;
    if (typeof parsed.title !== "string") return null;
    if (!Array.isArray(parsed.lines)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writePinned(storageKey: string, snap: CompareSnapshot) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(snap));
  } catch {
    /* ignore */
  }
}

function formatWhen(ts: number) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return String(ts);
  }
}

export function CompareDrawer(props: {
  open: boolean;
  onClose: () => void;
  storageKey: string;
  getCurrent: () => Omit<CompareSnapshot, "ts">;
}) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!props.open) return;
    queueMicrotask(() => setTick((t) => t + 1));
  }, [props.open]);

  const pinned = useMemo(() => readPinned(props.storageKey), [props.storageKey, tick]);
  const snapshot = props.getCurrent();
  const [currentTs, setCurrentTs] = useState(0);
  useEffect(() => {
    if (!props.open) {
      queueMicrotask(() => setCurrentTs(0));
      return;
    }
    queueMicrotask(() => setCurrentTs(Date.now()));
  }, [props.open]);

  if (!props.open) return null;

  return (
    <div className="fixed inset-0 z-[90]">
      <div
        className="absolute inset-0 bg-slate-950/25 backdrop-blur-[1px]"
        onMouseDown={props.onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Compare runs"
        className="absolute right-0 top-0 h-full w-full max-w-xl border-l border-slate-200 bg-white shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Compare</p>
            <p className="mt-1 truncate text-base font-extrabold tracking-tight text-slate-950">{snapshot.title}</p>
            <p className="mt-1 text-xs font-medium text-slate-600">
              Pin a baseline, then compare your current inputs/results against it (stored in this browser only).
            </p>
          </div>
          <Button variant="ghost" size="sm" type="button" onClick={props.onClose}>
            Close
          </Button>
        </div>

        <div className="h-[calc(100%-70px)] overflow-auto p-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="primary"
              size="sm"
              type="button"
              onClick={() => {
                writePinned(props.storageKey, {
                  ts: Date.now(),
                  title: snapshot.title,
                  lines: snapshot.lines,
                });
                setTick((t) => t + 1);
              }}
            >
              Pin current run
            </Button>
            {pinned ? (
              <Button
                variant="danger"
                size="sm"
                type="button"
                onClick={() => {
                  try {
                    localStorage.removeItem(props.storageKey);
                  } catch {
                    /* ignore */
                  }
                  setTick((t) => t + 1);
                }}
              >
                Clear pinned
              </Button>
            ) : null}
          </div>

          <div className="mt-4 grid gap-3">
            <Block
              title="Current"
              meta={currentTs > 0 ? formatWhen(currentTs) : "—"}
              lines={snapshot.lines}
            />
            <Block
              title="Pinned"
              meta={pinned ? formatWhen(pinned.ts) : "No pinned run yet"}
              lines={pinned?.lines ?? []}
              emptyLabel="Pin a run to compare against."
            />
            {pinned ? <Diff current={snapshot.lines} pinned={pinned.lines} /> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function Block(props: { title: string; meta: string; lines: string[]; emptyLabel?: string }) {
  return (
    <Card className="border-slate-200">
      <CardBody>
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-extrabold tracking-tight text-slate-950">{props.title}</p>
          <p className="text-xs font-semibold text-slate-500">{props.meta}</p>
        </div>
        {props.lines.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">{props.emptyLabel ?? "—"}</p>
        ) : (
          <ul className="mt-3 space-y-1 text-sm text-slate-800">
            {props.lines.map((l, idx) => (
              <li key={idx} className="flex gap-2">
                <span className="mt-[0.35rem] h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" aria-hidden="true" />
                <span className="min-w-0 break-words">{l}</span>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}

function Diff(props: { current: string[]; pinned: string[] }) {
  const curSet = new Set(props.current);
  const pinSet = new Set(props.pinned);
  const added = props.current.filter((l) => !pinSet.has(l));
  const removed = props.pinned.filter((l) => !curSet.has(l));

  if (added.length === 0 && removed.length === 0) {
    return (
      <Card className="border-slate-200 bg-emerald-50/30">
        <CardBody>
          <p className="text-sm font-semibold text-slate-900">No differences detected.</p>
          <p className="mt-1 text-xs font-medium text-slate-600">Based on the summary lines (UI-only heuristic).</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200">
      <CardBody>
        <p className="text-sm font-extrabold tracking-tight text-slate-950">Differences</p>
        <div className="mt-3 grid gap-3">
          {added.length > 0 ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Changed / added</p>
              <ul className="mt-2 space-y-1 text-sm text-slate-800">
                {added.map((l, idx) => (
                  <li key={idx} className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                    {l}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {removed.length > 0 ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Removed</p>
              <ul className="mt-2 space-y-1 text-sm text-slate-800">
                {removed.map((l, idx) => (
                  <li key={idx} className={cn("rounded-lg border border-rose-200 bg-rose-50 px-3 py-2")}>
                    {l}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </CardBody>
    </Card>
  );
}

