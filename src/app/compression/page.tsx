"use client";

import { createPortal } from "react-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { aiscShapes } from "@/lib/aisc/data";
import {
  filterShapesByFamily,
  shapeFamilyOptions,
  type ShapeFamilyKey,
} from "@/lib/aisc/shape-filters";
import { steelMaterialMap, steelMaterials, type SteelMaterialKey } from "@/lib/data/materials";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { CLIENT_PERSISTENCE } from "@/lib/client-persistence";
import { STORAGE } from "@/lib/storage/keys";
import { AppShell } from "@/components/layout/AppShell";
import { ResultHero } from "@/components/results/ResultHero";
import { PageFooterNav } from "@/components/navigation/PageFooterNav";
import { CalculatorActionRail } from "@/components/actions/CalculatorActionRail";
import { useBrowserDraft } from "@/features/module-runtime/useBrowserDraft";
import { smoothScrollTo } from "@/features/module-runtime/scroll";
import { formatRelativeTime } from "@/lib/format/relativeTime";
import { modalOverlayClass, modalPanelClass, modalSubtitleClass, modalTitleClass, useModalA11y } from "@/components/ui/modal";
import { useToast } from "@/components/ui/Toast";
import {
  compressionDefaults,
  compressionDraftSchema,
  evaluateCompression,
} from "@/features/steel/compression/module-config";
import {
  CompressionInputsGeneral,
  CompressionInputsMember,
  CompressionSectionPlaceholder,
  CompressionSectionPropertiesPanel,
  CompressionStepsPanel,
} from "@/features/steel/compression/components";

const META_CHIP =
  "inline-flex h-8 items-center rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-2)] px-2.5 text-[11px] font-semibold text-[color:var(--foreground)]/80 shadow-sm";

export default function CompressionPage() {
  const [material, setMaterial] = useState<SteelMaterialKey>(compressionDefaults.material as SteelMaterialKey);
  const [shapeFamily, setShapeFamily] = useState<ShapeFamilyKey>(compressionDefaults.shapeFamily as ShapeFamilyKey);
  const [shapeName, setShapeName] = useState(compressionDefaults.shapeName);
  const [k, setK] = useState(compressionDefaults.k);
  const [builtUpFactor, setBuiltUpFactor] = useState(compressionDefaults.builtUpFactor);
  const [L, setL] = useState(compressionDefaults.L);
  const [Pu, setPu] = useState(compressionDefaults.Pu);
  const [designMethod, setDesignMethod] = useState<"LRFD" | "ASD">(compressionDefaults.designMethod);
  const [mode, setMode] = useState<"check" | "design">(compressionDefaults.mode);
  const [detailsTab, setDetailsTab] = useState<"steps" | "section">("steps");
  const [helpOpen, setHelpOpen] = useState(false);
  const [resultFlash, setResultFlash] = useState(false);
  const { push } = useToast();
  const resultsHeadingRef = useRef<HTMLDivElement | null>(null);
  const flashTimerRef = useRef<number | null>(null);

  const { saving, savedAt, clearDraft } = useBrowserDraft({
    storageKey: STORAGE.compression,
    savedAtKey: CLIENT_PERSISTENCE.savedAt("compression"),
    schema: compressionDraftSchema,
    hydrate: (p) => {
      if (typeof p.material === "string") setMaterial(p.material as SteelMaterialKey);
      if (typeof p.shapeFamily === "string") setShapeFamily(p.shapeFamily as ShapeFamilyKey);
      if (typeof p.shapeName === "string") setShapeName(p.shapeName);
      if (typeof p.k === "string") setK(p.k);
      if (typeof p.builtUpFactor === "string") setBuiltUpFactor(p.builtUpFactor);
      if (typeof p.L === "string") setL(p.L);
      if (typeof p.Pu === "string") setPu(p.Pu);
      if (p.designMethod === "LRFD" || p.designMethod === "ASD") setDesignMethod(p.designMethod);
      if (p.mode === "check" || p.mode === "design") setMode(p.mode);
    },
    serialize: () => ({ material, shapeFamily, shapeName, k, builtUpFactor, L, Pu, designMethod, mode }),
    watch: [material, shapeFamily, shapeName, k, builtUpFactor, L, Pu, designMethod, mode],
  });

  const shapeChoices = useMemo(
    () => filterShapesByFamily(aiscShapes, shapeFamily, "compression"),
    [shapeFamily],
  );
  const shape = aiscShapes.find((s) => s.shape === shapeName);
  const mat = steelMaterialMap[material];

  const handleShapeFamilyChange = (v: ShapeFamilyKey) => {
    setShapeFamily(v);
    const list = filterShapesByFamily(aiscShapes, v, "compression");
    if (list.length === 0) return;
    if (!list.some((s) => s.shape === shapeName)) {
      setShapeName(list[0].shape);
    }
  };

  const kEffective = Number(k) * (Number.isFinite(Number(builtUpFactor)) && Number(builtUpFactor) > 0 ? Number(builtUpFactor) : 1);

  const designSuggestion = useMemo(() => {
    if (mode !== "design") return null;
    if (!Number.isFinite(kEffective) || kEffective <= 0) return null;
    const Lnum = Number(L);
    const demand = Number(Pu);
    if (!Number.isFinite(Lnum) || Lnum <= 0) return null;
    if (!Number.isFinite(demand) || demand < 0) return null;
    if (shapeChoices.length === 0) return null;

    const sorted = shapeChoices.slice().sort((a, b) => a.W - b.W);
    for (const s of sorted) {
      const r = evaluateCompression({
        designMethod,
        Fy: mat.Fy,
        E: 29000,
        k: kEffective,
        L: Lnum,
        rx: s.rx ?? 1,
        ry: s.ry ?? 1,
        Ag: s.A ?? 0,
        lambdaFlange: s.bf_2tf ?? 0,
        lambdaWeb: s.h_tw ?? 0,
        demandPu: demand,
      });
      if (r.isSafe) return s;
    }
    return null;
  }, [mode, kEffective, L, Pu, shapeChoices, designMethod, mat]);

  useEffect(() => {
    if (mode !== "design") return;
    if (!designSuggestion) return;
    queueMicrotask(() => setShapeName(designSuggestion.shape));
  }, [mode, designSuggestion]);

  const out = useMemo(
    () =>
      evaluateCompression({
        designMethod,
        Fy: mat.Fy,
        E: 29000,
        k: kEffective,
        L: Number(L),
        rx: shape?.rx ?? 1,
        ry: shape?.ry ?? 1,
        Ag: shape?.A ?? 0,
        lambdaFlange: shape?.bf_2tf ?? 0,
        lambdaWeb: shape?.h_tw ?? 0,
        demandPu: Number(Pu),
      }),
    [mat, designMethod, kEffective, L, Pu, shape],
  );

  const missingSlenderness = shape ? shape.bf_2tf <= 0 && shape.h_tw <= 0 : false;

  const resetInputs = useCallback(() => {
    clearDraft();
    setMaterial(compressionDefaults.material as SteelMaterialKey);
    setShapeFamily(compressionDefaults.shapeFamily as ShapeFamilyKey);
    setShapeName(compressionDefaults.shapeName);
    setK(compressionDefaults.k);
    setBuiltUpFactor(compressionDefaults.builtUpFactor);
    setL(compressionDefaults.L);
    setPu(compressionDefaults.Pu);
    setDesignMethod(compressionDefaults.designMethod);
    setMode(compressionDefaults.mode);
  }, [clearDraft]);

  const invalid = (v: string, min = 0) => {
    const n = Number(v);
    return !Number.isFinite(n) || n < min;
  };

  const invalidPu = invalid(Pu, 0);
  const invalidL = invalid(L, 0);
  const inputsInvalid = invalidPu || invalidL;

  const resultHeroStatus = inputsInvalid ? "invalid" : out.isSafe ? "safe" : "unsafe";

  useEffect(() => {
    // UI-only: subtle "changed" highlight to help scanning while iterating inputs.
    if (flashTimerRef.current) window.clearTimeout(flashTimerRef.current);
    setResultFlash(true);
    flashTimerRef.current = window.setTimeout(() => setResultFlash(false), 450);
    return () => {
      if (flashTimerRef.current) window.clearTimeout(flashTimerRef.current);
      flashTimerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [out.controllingStrength, out.demand, out.governingCase, inputsInvalid, designMethod, mat.key, shapeName]);

  const focusResults = useCallback(() => {
    try {
      resultsHeadingRef.current?.focus?.();
    } catch {
      /* ignore */
    }
  }, []);

  const jumpToInputs = useCallback(() => {
    smoothScrollTo("compression-general");
  }, []);

  const jumpToResults = useCallback(() => {
    smoothScrollTo("compression-results");
    window.setTimeout(() => focusResults(), 250);
  }, [focusResults]);

  const jumpToSteps = useCallback(() => {
    setDetailsTab("steps");
    smoothScrollTo("details");
  }, []);

  const jumpToSection = useCallback(() => {
    setDetailsTab("section");
    smoothScrollTo("details");
  }, []);

  useEffect(() => {
    function isTypingTarget(t: EventTarget | null) {
      if (!(t instanceof HTMLElement)) return false;
      const tag = t.tagName.toLowerCase();
      return tag === "input" || tag === "textarea" || tag === "select" || t.isContentEditable;
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      if (isTypingTarget(e.target)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === "?") {
        e.preventDefault();
        setHelpOpen(true);
      }
      if (k === "i") {
        e.preventDefault();
        jumpToInputs();
      }
      if (k === "r") {
        e.preventDefault();
        jumpToResults();
      }
      if (k === "s") {
        e.preventDefault();
        jumpToSteps();
      }
      if (k === "x") {
        e.preventDefault();
        jumpToSection();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [jumpToInputs, jumpToResults, jumpToSection, jumpToSteps]);

  const actionRailProps = useMemo(
    () => ({
      savedKey: CLIENT_PERSISTENCE.savedAt("compression"),
      saving,
      savedAt,
      compare: {
        storageKey: CLIENT_PERSISTENCE.compareSnapshot("compression"),
        getCurrent: () => ({
          title: `Compression — ${shapeName}`,
          lines: [
            `Method: ${designMethod} · Material: ${mat.key}`,
            `Pu/Pa = ${Pu} kips · L = ${L} in · K = ${k} · built-up = ${builtUpFactor}`,
            `Governing: ${out.governingCase}`,
            `Capacity: ${out.controllingStrength.toFixed(3)} kips`,
            `Demand: ${out.demand.toFixed(3)} kips`,
            `Utilization: ${out.controllingStrength > 0 ? ((out.demand / out.controllingStrength) * 100).toFixed(1) : "-"}%`,
          ],
        }),
      },
      copyText: () =>
        [
          "Compression",
          `Method: ${designMethod}`,
          `Material: ${mat.key}`,
          `Shape: ${shapeName}`,
          `Governing: ${out.governingCase}`,
          `Capacity: ${out.controllingStrength.toFixed(3)} kips`,
          `Demand: ${out.demand.toFixed(3)} kips`,
        ].join("\n"),
      onGoResults: () => smoothScrollTo("compression-results"),
      onGoSteps: () => smoothScrollTo("compression-steps"),
      saveSlots: {
        moduleKey: "compression",
        draftStorageKey: STORAGE.compression,
        getCurrent: () => ({ material, shapeFamily, shapeName, k, builtUpFactor, L, Pu, designMethod, mode }),
      },
      onReset: resetInputs,
    }),
    [
      saving,
      savedAt,
      shapeName,
      designMethod,
      mat.key,
      Pu,
      L,
      k,
      builtUpFactor,
      shapeFamily,
      mode,
      out,
      material,
      resetInputs,
    ],
  );

  const copyReportSnippet = useCallback(async () => {
    const text = [
      `Compression — ${shapeName}`,
      `Method: ${designMethod}`,
      `Material: ${mat.key}`,
      `Pu/Pa: ${Pu} kips`,
      `L: ${L} in`,
      `K: ${k} (built-up ${builtUpFactor})`,
      `Governing: ${String(out.governingCase)}`,
      `Capacity: ${out.controllingStrength.toFixed(3)} kips`,
      `Demand: ${out.demand.toFixed(3)} kips`,
      inputsInvalid || out.controllingStrength <= 0
        ? "Utilization: —"
        : `Utilization: ${((out.demand / out.controllingStrength) * 100).toFixed(1)}%`,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      push({ title: "Copied", message: "Report snippet copied to clipboard.", tone: "good" });
    } catch {
      push({ title: "Could not copy", message: "Your browser blocked clipboard access.", tone: "bad" });
    }
  }, [Pu, L, builtUpFactor, designMethod, inputsInvalid, k, mat.key, out, push, shapeName]);

  return (
    <AppShell>
      <div className="space-y-10 md:space-y-12">
        {/* Hero */}
        <section className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--zone-hero)] px-6 py-8 shadow-[var(--shadow-sm)] sm:px-10 sm:py-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
                steel module
              </p>
              <h1 className="mt-3 text-[34px] font-extrabold leading-[0.98] tracking-tight text-[color:var(--foreground)] sm:text-[44px]">
                <span className="bg-gradient-to-r from-[color:var(--heading-grad-from)] to-[color:var(--heading-grad-to)] bg-clip-text text-transparent">
                  Compression
                </span>{" "}
                Analysis &amp; Design
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[color:var(--muted)]">
                Column buckling (E3), LRFD or ASD. Inputs save in this browser.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className={META_CHIP}>
                  {saving
                    ? "Saving…"
                    : savedAt != null
                      ? `Saved ${formatRelativeTime(savedAt) ?? "recently"}`
                      : "Not saved yet"}
                </span>
                <span className={META_CHIP}>{mat.key}</span>
                <span className={META_CHIP}>{designMethod}</span>
                <span className={META_CHIP}>{shapeName}</span>
              </div>
            </div>

            <div className="w-full md:w-auto md:max-w-[360px]">
              <div
                className="relative overflow-hidden rounded-2xl border border-white/80 bg-white p-4 shadow-sm"
                aria-hidden="true"
              >
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent to-[color:var(--mint)]/55" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/compression.png"
                  alt=""
                  className="relative z-[1] mx-auto h-36 w-auto max-w-full object-contain sm:h-40 md:h-44"
                  draggable={false}
                  decoding="async"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Main workspace */}
        <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
          {/* Inputs */}
          <div className="space-y-6 lg:col-span-7">
            <CompressionInputsGeneral
              material={material}
              onMaterialChange={setMaterial}
              steelMaterials={steelMaterials}
              shapeFamily={shapeFamily}
              onShapeFamilyChange={handleShapeFamilyChange}
              shapeFamilyOptions={shapeFamilyOptions}
              shapeName={shapeName}
              onShapeNameChange={setShapeName}
              shapeChoices={shapeChoices}
              mode={mode}
              onModeChange={setMode}
              designSuggestionShape={designSuggestion?.shape ?? null}
            />
            <CompressionInputsMember
              designMethod={designMethod}
              onDesignMethodChange={setDesignMethod}
              Pu={Pu}
              onPuChange={setPu}
              L={L}
              onLChange={setL}
              k={k}
              onKChange={setK}
              builtUpFactor={builtUpFactor}
              onBuiltUpFactorChange={setBuiltUpFactor}
              kEffective={kEffective}
              invalidPu={invalidPu}
              invalidL={invalidL}
              onPresetK={() => setK("1.0")}
              onPresetBuiltUp={() => setBuiltUpFactor("1.0")}
            />
          </div>

          {/* Results + actions */}
          <div className="space-y-4 lg:col-span-5 lg:sticky lg:top-28" id="results">
            <div
              ref={resultsHeadingRef}
              tabIndex={-1}
              className="sr-only"
              aria-label="Results region"
            />
            <div id="compression-results">
              <div
                className={[
                  "transition",
                  resultFlash ? "ring-4 ring-[color:var(--brand)]/10 rounded-[20px]" : "",
                ].join(" ")}
              >
                <ResultHero
                  status={resultHeroStatus}
                  governing={out.governingCase}
                  capacityLabel={designMethod === "LRFD" ? "Design strength (φPn)" : "Allowable (Pn/Ω)"}
                  capacity={`${out.controllingStrength.toFixed(3)} kips`}
                  demandLabel={designMethod === "LRFD" ? "Demand Pu" : "Demand Pa"}
                  demand={`${out.demand.toFixed(3)} kips`}
                  utilization={inputsInvalid ? undefined : out.controllingStrength > 0 ? out.demand / out.controllingStrength : undefined}
                  metaRight={<Badge tone="info">{mat.key}</Badge>}
                  actions={
                    <>
                      <Button variant="secondary" size="sm" type="button" onClick={copyReportSnippet}>
                        Copy snippet
                      </Button>
                    </>
                  }
                />
              </div>
            </div>

            {inputsInvalid ? (
              <Card className="bg-[color:var(--surface)]">
                <CardHeader
                  title="Fix inputs to compute results"
                  description="Some required fields are invalid. Jump to the field and correct it."
                  right={<Badge tone="bad">Needs attention</Badge>}
                />
                <CardBody className="flex flex-wrap gap-2">
                  {invalidPu ? (
                    <Button variant="secondary" size="sm" type="button" onClick={() => smoothScrollTo("field-pu")}>
                      Pu / Pa
                    </Button>
                  ) : null}
                  {invalidL ? (
                    <Button variant="secondary" size="sm" type="button" onClick={() => smoothScrollTo("field-l")}>
                      L
                    </Button>
                  ) : null}
                  <span className="self-center text-xs font-semibold text-[color:var(--muted)]">
                    Tip: press <span className="font-mono">I</span> to return to inputs.
                  </span>
                </CardBody>
              </Card>
            ) : null}

            {missingSlenderness ? (
              <Card className="bg-[color:var(--surface-2)]">
                <CardHeader
                  title="Assumptions"
                  description="Local slender-element checks are excluded when shape slenderness data is unavailable."
                  right={<Badge tone="info">E3</Badge>}
                />
                <CardBody className="text-sm text-[color:var(--muted)]">
                  For HSS, verify wall slenderness and any applicable AISC limits outside this tool.
                </CardBody>
              </Card>
            ) : null}

            <div id="actions">
              <CalculatorActionRail {...actionRailProps} title="Actions" subtitle={`${shapeName} · ${designMethod}`} />
            </div>
          </div>
        </div>

        {/* Details */}
        <section id="details" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-2xl font-extrabold tracking-tight text-[color:var(--accent)]">Details</p>
              <p className="mt-1 text-sm text-[color:var(--muted)]">Review calculation steps or verify the AISC section snapshot.</p>
            </div>
            <div
              role="tablist"
              aria-label="Details view"
              className="inline-flex w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)]/75 p-1 shadow-sm backdrop-blur sm:w-auto"
              onKeyDown={(e) => {
                if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
                e.preventDefault();
                setDetailsTab((cur) => {
                  if (cur === "steps") return "section";
                  return "steps";
                });
              }}
            >
              <button
                type="button"
                role="tab"
                aria-selected={detailsTab === "steps"}
                aria-controls="details-panel"
                onClick={() => setDetailsTab("steps")}
                className={[
                  "min-h-10 flex-1 rounded-2xl px-4 text-sm font-semibold transition sm:flex-none focus-visible:outline-none",
                  detailsTab === "steps"
                    ? "bg-[color:var(--mint)] text-[color:var(--accent)] shadow-sm"
                    : "text-[color:var(--muted)] hover:bg-[color:var(--surface-2)]",
                ].join(" ")}
              >
                Steps
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={detailsTab === "section"}
                aria-controls="details-panel"
                onClick={() => setDetailsTab("section")}
                className={[
                  "min-h-10 flex-1 rounded-2xl px-4 text-sm font-semibold transition sm:flex-none focus-visible:outline-none",
                  detailsTab === "section"
                    ? "bg-[color:var(--mint)] text-[color:var(--accent)] shadow-sm"
                    : "text-[color:var(--muted)] hover:bg-[color:var(--surface-2)]",
                ].join(" ")}
              >
                Section
              </button>
            </div>
          </div>

          <div id="details-panel" role="tabpanel" aria-label={detailsTab === "steps" ? "Steps" : "Section"} className="space-y-6">
            {detailsTab === "steps" ? (
              <CompressionStepsPanel
                steps={out.steps}
                governingCase={String(out.governingCase)}
                controllingStrength={out.controllingStrength}
              />
            ) : shape ? (
              <CompressionSectionPropertiesPanel shape={shape} />
            ) : (
              <CompressionSectionPlaceholder />
            )}
          </div>
        </section>

      </div>

      <HelpOverlay open={helpOpen} onClose={() => setHelpOpen(false)} />
    </AppShell>
  );
}

function HelpOverlay(props: { open: boolean; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  useModalA11y({ open: props.open, onClose: props.onClose, containerRef: panelRef, initialFocusRef: closeRef });

  if (!props.open) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="not-print fixed inset-0 z-[90] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Help">
      <button type="button" className={modalOverlayClass} onClick={props.onClose} aria-label="Close help" />
      <div ref={panelRef} className={`${modalPanelClass} max-w-lg p-6`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className={modalTitleClass}>Compression — quick help</h2>
            <p className={modalSubtitleClass}>
              Keyboard shortcuts and workflow tips. (Press <span className="font-mono">Esc</span> to close.)
            </p>
          </div>
          <Button ref={closeRef} variant="ghost" size="sm" type="button" onClick={props.onClose}>
            Close
          </Button>
        </div>

        <div className="mt-5 space-y-4 text-sm">
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-3)]/55 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--muted)]">Shortcuts</p>
            <ul className="mt-2 space-y-1 text-[color:var(--foreground)]">
              <li>
                <span className="font-mono font-semibold">I</span> — Inputs
              </li>
              <li>
                <span className="font-mono font-semibold">R</span> — Results
              </li>
              <li>
                <span className="font-mono font-semibold">S</span> — Steps (opens Details)
              </li>
              <li>
                <span className="font-mono font-semibold">X</span> — Section (opens Details)
              </li>
              <li>
                <span className="font-mono font-semibold">?</span> — Help
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--muted)]">Tips</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-[color:var(--foreground)]/90">
              <li>Use “Find shape” to filter large AISC lists quickly.</li>
              <li>Use “Advanced” in Member if you need built-up K adjustments.</li>
              <li>In Steps, use search + “Key steps only” to reduce noise.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
