"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CopySummaryButton } from "@/components/actions/CopySummaryButton";
import { cn } from "@/lib/utils";
import { CompareDrawer, type CompareSnapshot } from "@/components/compare/CompareDrawer";
import { modalOverlayClass, modalPanelClass, useModalA11y } from "@/components/ui/modal";
import { formatRelativeTime } from "@/lib/format/relativeTime";

type CompareSpec = { storageKey: string; getCurrent: () => Omit<CompareSnapshot, "ts"> };
type SaveSlot = { id: string; name: string; ts: number; payload: Record<string, unknown> };
type SaveSlotsSpec = {
  moduleKey: string;
  draftStorageKey: string;
  getCurrent: () => Record<string, unknown>;
  maxSlots?: number;
};

export function CalculatorActionRail(props: {
  desktopClassName?: string;
  /** When true, only the mobile bottom bar + spacer render (use for the rail below the main card). */
  mobileOnly?: boolean;
  /** When true, do not render the fixed mobile bar (use on the in-page / sidebar rail so only one bottom bar exists). */
  hideMobileBar?: boolean;
  /** Increment to programmatically open the mobile sheet. */
  openSheetTick?: number;
  title?: string;
  subtitle?: string;
  /** LocalStorage key for last-saved timestamp (see `CLIENT_PERSISTENCE.savedAt`). */
  savedKey?: string;
  /** UI-only transient state from parent. If set, overrides savedKey-derived label. */
  saving?: boolean;
  savedAt?: number | null;
  onGoResults?: () => void;
  copyText: () => string;
  compare?: CompareSpec;
  saveSlots?: SaveSlotsSpec;
  onReset?: () => void;
  onGoSteps?: () => void;
}) {
  const [resetArmed, setResetArmed] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [slotsOpen, setSlotsOpen] = useState(false);
  const [slots, setSlots] = useState<SaveSlot[]>([]);
  const [slotName, setSlotName] = useState("");
  const maxSlots = props.saveSlots?.maxSlots ?? 20;
  const [savedTick, setSavedTick] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const slotsStorageKey = props.saveSlots ? `spanledger/v1/saves/${props.saveSlots.moduleKey}` : null;

  // (dev-only debug logging removed for production safety)

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!props.savedKey) return;
    const t = window.setInterval(() => setSavedTick((v) => v + 1), 10_000);
    return () => window.clearInterval(t);
  }, [props.savedKey]);

  useEffect(() => {
    if (!slotsStorageKey) return;
    try {
      const raw = localStorage.getItem(slotsStorageKey);
      const parsed = raw ? (JSON.parse(raw) as unknown) : [];
      const next = Array.isArray(parsed)
        ? parsed
            .filter((x) => typeof x === "object" && x !== null)
            .map((x) => x as SaveSlot)
            .filter((s) => typeof s.id === "string" && typeof s.name === "string" && typeof s.ts === "number")
            .slice(0, maxSlots)
        : [];
      setSlots(next);
    } catch {
      setSlots([]);
    }
  }, [slotsStorageKey, maxSlots, savedTick]);

  const persistSlots = (next: SaveSlot[]) => {
    if (!slotsStorageKey) return;
    const trimmed = next.slice(0, maxSlots);
    setSlots(trimmed);
    try {
      localStorage.setItem(slotsStorageKey, JSON.stringify(trimmed));
    } catch {
      /* ignore */
    }
  };

  const savedLabel = useMemo(() => {
    // savedTick intentionally triggers refresh for relative timestamps
    void savedTick;
    // Avoid hydration mismatch: the server can't read localStorage and relative time depends on Date.now().
    // So we render no saved label until after first client mount.
    if (!hydrated) return null;
    if (props.saving) return "Saving…";
    if (props.savedAt && Number.isFinite(props.savedAt))
      return `Saved ${formatRelativeTime(props.savedAt) ?? "recently"}`;
    if (!props.savedKey) return null;
    try {
      const raw = localStorage.getItem(props.savedKey);
      const ts = raw ? Number(raw) : NaN;
      if (!Number.isFinite(ts)) return null;
      return `Saved ${formatRelativeTime(ts) ?? "recently"}`;
    } catch {
      return null;
    }
  }, [hydrated, props.savedKey, props.saving, props.savedAt, savedTick]);

  // (dev-only debug logging removed for production safety)

  const sheetPanelRef = useRef<HTMLDivElement | null>(null);
  const sheetCloseRef = useRef<HTMLButtonElement | null>(null);
  useModalA11y({
    open: sheetOpen,
    onClose: () => setSheetOpen(false),
    initialFocusRef: sheetCloseRef,
    containerRef: sheetPanelRef,
  });

  useEffect(() => {
    if (!hydrated) return;
    if (!props.openSheetTick) return;
    setSheetOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.openSheetTick, hydrated]);

  const header = useMemo(() => {
    if (!props.title && !props.subtitle) return null;
    return (
      <div className="mb-3">
        {props.title ? <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{props.title}</p> : null}
        {props.subtitle ? <p className="mt-1 text-sm font-semibold text-slate-950">{props.subtitle}</p> : null}
        {savedLabel ? <p className="mt-1 text-xs font-medium text-slate-600">{savedLabel}</p> : null}
      </div>
    );
  }, [props.title, props.subtitle, savedLabel]);

  const saveCurrentToSlot = () => {
    if (!props.saveSlots) return;
    const payload = props.saveSlots.getCurrent();
    const name = slotName.trim() || `Save ${slots.length + 1}`;
    const ts = Date.now();
    const slot: SaveSlot = {
      id: `${ts}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      ts,
      payload,
    };
    if (slots.length >= maxSlots) return;
    persistSlots([slot, ...slots].sort((a, b) => b.ts - a.ts));
    setSlotName("");
  };

  const loadSlot = (slot: SaveSlot) => {
    if (!props.saveSlots) return;
    try {
      localStorage.setItem(props.saveSlots.draftStorageKey, JSON.stringify(slot.payload));
      if (props.savedKey) localStorage.setItem(props.savedKey, String(Date.now()));
      window.location.reload();
    } catch {
      /* ignore */
    }
  };

  const renameSlot = (slot: SaveSlot) => {
    const next = window.prompt("Rename save slot", slot.name);
    if (!next) return;
    const name = next.trim();
    if (!name) return;
    persistSlots(slots.map((s) => (s.id === slot.id ? { ...s, name } : s)));
  };

  const deleteSlot = (slot: SaveSlot) => {
    persistSlots(slots.filter((s) => s.id !== slot.id));
  };

  return (
    <>
      {/* Desktop rail */}
      {!props.mobileOnly ? (
      <div className={cn("hidden md:block", props.desktopClassName)}>
        <Card className="border-slate-200">
          <CardBody className="space-y-3">
            {header}
            <div className="flex flex-wrap gap-2">
              <CopySummaryButton getText={props.copyText} label="Copy summary" />
              {props.saveSlots ? (
                <Button variant="secondary" size="sm" type="button" onClick={() => setSlotsOpen(true)}>
                  Saves ({slots.length}/{maxSlots})
                </Button>
              ) : null}
              {props.onGoSteps ? (
                <Button variant="secondary" size="sm" onClick={props.onGoSteps}>
                  Steps
                </Button>
              ) : null}
              {props.compare ? (
                <Button variant="secondary" size="sm" type="button" onClick={() => setCompareOpen(true)}>
                  Compare
                </Button>
              ) : null}
            </div>

            {props.onReset ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reset</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant={resetArmed ? "danger" : "secondary"}
                    size="sm"
                    onClick={() => {
                      if (!resetArmed) {
                        setResetArmed(true);
                        window.setTimeout(() => setResetArmed(false), 1500);
                        return;
                      }
                      setResetArmed(false);
                      props.onReset?.();
                    }}
                  >
                    {resetArmed ? "Confirm reset" : "Reset inputs"}
                  </Button>
                  <span className="text-xs font-medium text-slate-600">Clears saved inputs in this browser.</span>
                </div>
              </div>
            ) : null}
          </CardBody>
        </Card>
      </div>
      ) : null}

      {/* Mobile bottom bar */}
      {!props.hideMobileBar ? (
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/90 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-2.5 pb-[calc(env(safe-area-inset-bottom,0px)+10px)]">
          <div className="min-w-0">
            {props.subtitle ? <p className="truncate text-xs font-semibold text-slate-800">{props.subtitle}</p> : null}
            <p className="hidden text-[11px] font-medium text-slate-600 sm:block">
              {savedLabel ? `${savedLabel} · ` : ""}Copy, manage saves, jump to steps, or reset.
            </p>
          </div>
          <div className="flex w-full flex-wrap items-center justify-end gap-2">
            {props.onGoResults ? (
              <Button variant="secondary" size="sm" onClick={props.onGoResults}>
                Results
              </Button>
            ) : null}
            {props.onGoSteps ? (
              <div className="hidden sm:block">
                <Button variant="secondary" size="sm" onClick={props.onGoSteps}>
                  Steps
                </Button>
              </div>
            ) : null}
            {props.compare ? (
              <div className="hidden sm:block">
                <Button variant="secondary" size="sm" type="button" onClick={() => setCompareOpen(true)}>
                  Compare
                </Button>
              </div>
            ) : null}
            {props.saveSlots ? (
              <div className="hidden sm:block">
                <Button variant="secondary" size="sm" type="button" onClick={() => setSlotsOpen(true)}>
                  Saves
                </Button>
              </div>
            ) : null}
            <CopySummaryButton getText={props.copyText} label="Copy" />
            {props.onReset ? (
              <Button variant="secondary" size="sm" type="button" onClick={() => setSheetOpen(true)}>
                More
              </Button>
            ) : null}
          </div>
        </div>
      </div>
      ) : null}
      {!props.hideMobileBar ? <div className="h-[calc(env(safe-area-inset-bottom,0px)+64px)] md:hidden" aria-hidden="true" /> : null}

      {sheetOpen ? (
        <div className="fixed inset-0 z-[90] md:hidden" role="dialog" aria-modal="true" aria-label="Actions">
          <button
            type="button"
            className={modalOverlayClass}
            aria-label="Close actions"
            onClick={() => setSheetOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0">
            <div ref={sheetPanelRef} className={cn(modalPanelClass, "rounded-b-none border-slate-200 pb-[env(safe-area-inset-bottom,0px)]")}>
              <div className="flex justify-center pt-3">
                <div className="h-1 w-10 rounded-full bg-slate-200" aria-hidden="true" />
              </div>
              <CardBody className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</p>
                    {props.subtitle ? <p className="mt-1 truncate text-sm font-semibold text-slate-950">{props.subtitle}</p> : null}
                  </div>
                  <Button ref={sheetCloseRef} variant="ghost" size="sm" type="button" onClick={() => setSheetOpen(false)}>
                    Close
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <CopySummaryButton getText={props.copyText} label="Copy summary" />
                  {props.saveSlots ? (
                    <Button variant="secondary" size="sm" type="button" onClick={() => { setSheetOpen(false); setSlotsOpen(true); }}>
                      Saves ({slots.length}/{maxSlots})
                    </Button>
                  ) : null}
                  {props.onGoSteps ? (
                    <Button variant="secondary" size="sm" onClick={() => { setSheetOpen(false); props.onGoSteps?.(); }}>
                      Steps
                    </Button>
                  ) : null}
                  {props.compare ? (
                    <Button variant="secondary" size="sm" type="button" onClick={() => { setSheetOpen(false); setCompareOpen(true); }}>
                      Compare
                    </Button>
                  ) : null}
                </div>

                {props.onReset ? (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reset</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant={resetArmed ? "danger" : "secondary"}
                        size="sm"
                        onClick={() => {
                          if (!resetArmed) {
                            setResetArmed(true);
                            window.setTimeout(() => setResetArmed(false), 1500);
                            return;
                          }
                          setResetArmed(false);
                          setSheetOpen(false);
                          props.onReset?.();
                        }}
                      >
                        {resetArmed ? "Confirm reset" : "Reset inputs"}
                      </Button>
                      <span className="text-xs font-medium text-slate-600">Clears saved inputs in this browser.</span>
                    </div>
                  </div>
                ) : null}
              </CardBody>
            </div>
          </div>
        </div>
      ) : null}

      {props.compare ? (
        <CompareDrawer
          open={compareOpen}
          onClose={() => setCompareOpen(false)}
          storageKey={props.compare.storageKey}
          getCurrent={props.compare.getCurrent}
        />
      ) : null}

      {slotsOpen && props.saveSlots ? (
        <div className="fixed inset-0 z-[95]" role="dialog" aria-modal="true" aria-label="Save slots">
          <button type="button" className={modalOverlayClass} aria-label="Close save slots" onClick={() => setSlotsOpen(false)} />
          <div className="fixed inset-0 z-[96] flex items-center justify-center p-4">
            <div className={cn(modalPanelClass, "w-full max-w-2xl")}>
              <CardBody className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Save slots</p>
                    <p className="text-sm font-semibold text-slate-950">Save / Load / Rename / Delete ({slots.length}/{maxSlots})</p>
                  </div>
                  <Button variant="ghost" size="sm" type="button" onClick={() => setSlotsOpen(false)}>
                    Close
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    value={slotName}
                    onChange={(e) => setSlotName(e.target.value)}
                    placeholder="Name this save (optional)"
                    className="min-h-11 w-full flex-1 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--foreground)] sm:min-w-[240px]"
                  />
                  <Button variant="primary" size="sm" type="button" disabled={slots.length >= maxSlots} onClick={saveCurrentToSlot}>
                    Save current
                  </Button>
                </div>
                <div className="max-h-[45vh] space-y-2 overflow-auto pr-1">
                  {slots.length === 0 ? (
                    <p className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] p-3 text-sm text-[color:var(--muted)]">
                      No saved calculations yet.
                    </p>
                  ) : (
                    slots
                      .sort((a, b) => b.ts - a.ts)
                      .map((slot) => (
                        <div
                          key={slot.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] p-3"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[color:var(--foreground)]">{slot.name}</p>
                            <p className="text-xs font-medium text-[color:var(--muted)]">{formatRelativeTime(slot.ts) ?? "just now"}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Button variant="secondary" size="sm" type="button" onClick={() => loadSlot(slot)}>
                              Load
                            </Button>
                            <Button variant="ghost" size="sm" type="button" onClick={() => renameSlot(slot)}>
                              Rename
                            </Button>
                            <Button variant="danger" size="sm" type="button" onClick={() => deleteSlot(slot)}>
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </CardBody>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

