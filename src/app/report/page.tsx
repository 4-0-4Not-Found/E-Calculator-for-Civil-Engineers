"use client";

import { useMemo, useState, useEffect, type ReactNode } from "react";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { BeamLimitStates, CalculationOutput, CalculationResult, CalculationStep } from "@/lib/types/calculation";
import { readModuleStoresFromLocalStorage, summarizeModuleStores } from "@/lib/report/snapshot-store";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { PRODUCT_BRAND } from "@/lib/brand";
import { ModuleHero } from "@/components/layout/ModuleHero";
import { cn } from "@/lib/utils";

function formatNumberForReport(v: number): string {
  if (!Number.isFinite(v)) {
    if (v === Number.POSITIVE_INFINITY) return "∞ (not controlling)";
    if (v === Number.NEGATIVE_INFINITY) return "−∞";
    return "—";
  }
  const a = Math.abs(v);
  if (a === 0) return "0";
  if (a >= 10000 || (a < 1e-4 && a > 0)) return v.toExponential(4);
  return a >= 100 ? v.toFixed(2) : a >= 1 ? v.toFixed(4) : v.toFixed(6);
}

function formatStepCell(step: CalculationStep): string {
  const v = step.value;
  if (typeof v === "string") {
    return step.unit ? `${v} ${step.unit}` : v;
  }
  return `${formatNumberForReport(v)}${step.unit ? ` ${step.unit}` : ""}`;
}

function CalculationStepsTable({ steps, title }: { steps: CalculationStep[]; title: string }) {
  if (steps.length === 0) return null;
  return (
    <div className="mt-4 print:break-inside-avoid">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-700 print:text-[10px]">{title}</h4>
      <div className="mt-2 overflow-x-auto rounded-lg border border-slate-200 print:border-slate-300">
        <table className="w-full border-collapse text-xs print:text-[10px]">
          <thead>
            <tr className="bg-slate-50 text-slate-700">
              <th scope="col" className="border-b border-slate-200 px-3 py-2 text-left font-semibold">Item</th>
              <th scope="col" className="border-b border-slate-200 px-3 py-2 text-left font-semibold">Formula / reference</th>
              <th scope="col" className="border-b border-slate-200 px-3 py-2 text-right font-semibold">Result</th>
            </tr>
          </thead>
          <tbody>
            {steps.map((s, idx) => (
              <tr
                key={s.id}
                className={
                  idx % 2 === 1
                    ? "align-top bg-slate-50/50 hover:bg-slate-100/60"
                    : "align-top hover:bg-slate-50/60"
                }
              >
                <td className="border-t border-slate-200/70 px-3 py-2">{s.label}</td>
                <td className="border-t border-slate-200/70 px-3 py-2 text-slate-600">{s.formula ?? "—"}</td>
                <td className="border-t border-slate-200/70 px-3 py-2 text-right font-mono tabular-nums text-slate-900">
                  {formatStepCell(s)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {steps.some((s) => s.note) ? (
        <ul className="mt-2 list-disc space-y-0.5 pl-5 text-[11px] text-slate-600 print:text-[9px]">
          {steps
            .filter((s) => s.note)
            .map((s) => (
              <li key={`${s.id}-note`}>
                <span className="font-medium text-slate-700">{s.label}:</span> {s.note}
              </li>
            ))}
        </ul>
      ) : null}
    </div>
  );
}

function LimitStatesResultsTable({ results }: { results: Record<string, CalculationResult> }) {
  const rows = Object.values(results);
  if (rows.length === 0) return null;
  return (
    <div className="mt-4 print:break-inside-avoid">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-700 print:text-[10px]">Limit states (capacities)</h4>
      <div className="mt-2 overflow-x-auto rounded-lg border border-slate-200 print:border-slate-300">
        <table className="w-full min-w-[28rem] border-collapse text-xs print:min-w-0 print:text-[10px]">
          <thead>
            <tr className="bg-slate-50 text-slate-700">
              <th scope="col" className="border-b border-slate-200 px-3 py-2 text-left font-semibold">Mode</th>
              <th scope="col" className="border-b border-slate-200 px-3 py-2 text-right font-semibold">φR_n or allowable</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={r.name} className={idx % 2 === 1 ? "bg-slate-50/50" : undefined}>
                <td className="border-t border-slate-200/70 px-3 py-2">{r.name}</td>
                <td className="border-t border-slate-200/70 px-3 py-2 text-right font-mono tabular-nums">
                  {formatNumberForReport(r.phiPn)} {r.unit}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BeamLimitStatesBlock({ beamLimitStates, overallSafe }: { beamLimitStates: BeamLimitStates; overallSafe: boolean }) {
  const b = beamLimitStates;
  return (
    <div className="mt-4 space-y-2 rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-xs print:break-inside-avoid print:bg-transparent">
      <h4 className="font-semibold text-slate-900">Demand / capacity by limit state</h4>
      <div className="overflow-x-auto rounded border border-slate-200/70 bg-white print:border-slate-300">
        <table className="w-full min-w-[38rem] border-collapse print:min-w-0 print:text-[10px]">
          <thead>
            <tr className="bg-slate-50 text-slate-700">
              <th scope="col" className="border-b border-slate-200 px-3 py-2 text-left font-semibold">Check</th>
              <th scope="col" className="border-b border-slate-200 px-3 py-2 text-right font-semibold">Demand</th>
              <th scope="col" className="border-b border-slate-200 px-3 py-2 text-right font-semibold">Capacity</th>
              <th scope="col" className="border-b border-slate-200 px-3 py-2 text-right font-semibold">D/C / ratio</th>
              <th scope="col" className="border-b border-slate-200 px-3 py-2 text-left font-semibold">Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-slate-50/50">
              <td className="border-t border-slate-200/70 px-3 py-2">Flexure</td>
              <td className="border-t border-slate-200/70 px-3 py-2 text-right font-mono">{formatNumberForReport(b.bending.demand)}</td>
              <td className="border-t border-slate-200/70 px-3 py-2 text-right font-mono">{formatNumberForReport(b.bending.capacity)}</td>
              <td className="border-t border-slate-200/70 px-3 py-2 text-right font-mono">{formatNumberForReport(b.bending.ratio)}</td>
              <td className="border-t border-slate-200/70 px-3 py-2 text-slate-600">{b.bending.unit}</td>
            </tr>
            <tr>
              <td className="border-t border-slate-200/70 px-3 py-2">Shear</td>
              <td className="border-t border-slate-200/70 px-3 py-2 text-right font-mono">{formatNumberForReport(b.shear.demand)}</td>
              <td className="border-t border-slate-200/70 px-3 py-2 text-right font-mono">{formatNumberForReport(b.shear.capacity)}</td>
              <td className="border-t border-slate-200/70 px-3 py-2 text-right font-mono">{formatNumberForReport(b.shear.ratio)}</td>
              <td className="border-t border-slate-200/70 px-3 py-2 text-slate-600">
                {b.shear.unit}; {b.shear.cvCase}; C_v = {formatNumberForReport(b.shear.cv)}
              </td>
            </tr>
            <tr className="bg-slate-50/50">
              <td className="border-t border-slate-200/70 px-3 py-2">Deflection</td>
              <td className="border-t border-slate-200/70 px-3 py-2 text-right font-mono">{formatNumberForReport(b.deflection.demand)}</td>
              <td className="border-t border-slate-200/70 px-3 py-2 text-right font-mono">{formatNumberForReport(b.deflection.capacity)}</td>
              <td className="border-t border-slate-200/70 px-3 py-2 text-right font-mono">{formatNumberForReport(b.deflection.ratio)}</td>
              <td className="border-t border-slate-200/70 px-3 py-2 text-slate-600">{b.deflection.unit} (demand = δ, capacity = δ_allow)</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-slate-800">
        <span className="font-semibold">Governing (max ratio):</span> {b.governing} ·{" "}
        <span className="font-semibold">Overall member:</span>{" "}
        <span className={overallSafe ? "font-bold text-emerald-700" : "font-bold text-rose-700"}>
          {overallSafe ? "SAFE" : "NOT SAFE"}
        </span>
      </p>
    </div>
  );
}

function ModuleSummaryStrip({ output }: { output: CalculationOutput }) {
  const utilPct =
    output.controllingStrength > 0 && Number.isFinite(output.demand)
      ? (output.demand / output.controllingStrength) * 100
      : null;
  return (
    <div className="grid gap-2 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 sm:grid-cols-3 print:border-slate-300 print:text-[10px]">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Governing</p>
        <p className="mt-0.5 font-semibold text-slate-900">{output.governingCase}</p>
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Capacity / demand</p>
        <p className="mt-0.5 font-mono tabular-nums text-slate-900">
          {formatNumberForReport(output.controllingStrength)} / {formatNumberForReport(output.demand)}
        </p>
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Status</p>
        <p className="mt-0.5">
          <span className={output.isSafe ? "font-bold text-emerald-700" : "font-bold text-rose-700"}>
            {output.isSafe ? "SAFE" : "NOT SAFE"}
          </span>
          {utilPct != null ? (
            <span className="ml-2 font-mono tabular-nums text-slate-600">
              ({utilPct.toFixed(1)}% util.)
            </span>
          ) : null}
        </p>
      </div>
    </div>
  );
}

/**
 * One row in the "at-a-glance" status grid at the top of the report.
 * Compact card: module label, snapshot status pill (or "no data"), and a
 * "Jump" link that scrolls to the matching <details id="..."> below.
 */
function StatusOverviewCard(props: {
  label: string;
  href: string;
  state: "safe" | "unsafe" | "empty";
  detail?: string;
  utilPct?: number | null;
}) {
  const tone =
    props.state === "safe" ? "good" : props.state === "unsafe" ? "bad" : "neutral";
  const pillText =
    props.state === "safe" ? "SAFE" : props.state === "unsafe" ? "NOT SAFE" : "No data";
  return (
    <a
      href={props.href}
      className="group rounded-2xl border border-slate-200 bg-white p-4 no-underline shadow-sm transition hover:-translate-y-0.5 hover:border-[color:var(--accent-weak)] hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--brand)]/15"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-extrabold tracking-tight text-slate-950">{props.label}</p>
        <Badge tone={tone}>{pillText}</Badge>
      </div>
      {props.detail ? (
        <p className="mt-2 truncate text-xs font-medium text-slate-600">{props.detail}</p>
      ) : null}
      {props.utilPct != null && Number.isFinite(props.utilPct) ? (
        <p className="mt-1 text-xs font-mono tabular-nums text-slate-500">{props.utilPct.toFixed(1)}% util.</p>
      ) : null}
      <p className="mt-3 text-xs font-semibold text-[color:var(--brand)] opacity-80 group-hover:opacity-100">
        Jump to section →
      </p>
    </a>
  );
}

/**
 * Visually consistent collapsible section wrapper for each module's
 * snapshot. Used by all four modules so headers, status pill placement,
 * and spacing stay identical.
 *
 * For print, the on-screen summary is hidden by `globals.css` and a
 * dedicated `.report-print-section-header` is shown so each module gets a
 * proper printed h2 + status pill, and (for non-first sections) starts on a
 * fresh page.
 */
function ReportSection(props: {
  id: string;
  label: string;
  scenario?: ReactNode;
  /** Plain-string version of `scenario` for the print header. */
  scenarioText?: string;
  status: "safe" | "unsafe" | "empty" | "error";
  errorText?: string;
  /** When true, this section starts on a new printed page. */
  printPageBreak?: boolean;
  children: ReactNode;
}) {
  const pillTone: "good" | "bad" | "neutral" =
    props.status === "safe" ? "good" : props.status === "unsafe" || props.status === "error" ? "bad" : "neutral";
  const pillLabel =
    props.status === "safe"
      ? "SAFE"
      : props.status === "unsafe"
        ? "NOT SAFE"
        : props.status === "error"
          ? "ERROR"
          : "EMPTY";
  const pillPrintCls =
    props.status === "safe" ? "safe" : props.status === "unsafe" || props.status === "error" ? "unsafe" : "empty";
  return (
    <details
      id={props.id}
      open
      className={cn(
        "scroll-mt-24 rounded-2xl border border-slate-200 bg-white shadow-sm transition print:break-inside-avoid print:border-0 print:shadow-none",
        props.printPageBreak ? "report-print-break-before" : null,
      )}
    >
      <summary className="cursor-pointer list-none px-5 py-4 [&::-webkit-details-marker]:hidden">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-extrabold tracking-tight text-slate-950">{props.label}</p>
            {props.scenario ? (
              <p className="mt-1 text-xs font-medium text-slate-600">{props.scenario}</p>
            ) : null}
          </div>
          <Badge tone={pillTone}>{pillLabel}</Badge>
        </div>
      </summary>

      {/* Print-only header (replaces the on-screen <summary> that print CSS hides). */}
      <div className="report-print-only report-print-section-header">
        <div>
          <h2>{props.label}</h2>
          {props.scenarioText ? <p className="scenario">{props.scenarioText}</p> : null}
        </div>
        <span className={cn("pill", pillPrintCls)}>{pillLabel}</span>
      </div>

      <div className="border-t border-slate-200 p-5 print:border-t-0 print:p-0">
        {props.status === "empty" ? (
          <EmptyModuleState
            errorText={props.errorText ?? "No saved data yet — open the calculator and the report will fill itself in."}
          />
        ) : (
          props.children
        )}
      </div>
    </details>
  );
}

function EmptyModuleState({ errorText }: { errorText: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600">
      <span
        aria-hidden="true"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-base font-extrabold text-slate-400 ring-1 ring-inset ring-slate-200"
      >
        ∅
      </span>
      <span className="min-w-0 font-medium">{errorText}</span>
    </div>
  );
}

export default function ReportPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  const summaries = useMemo(() => {
    if (!mounted || typeof window === "undefined") return null;
    const stores = readModuleStoresFromLocalStorage();
    return summarizeModuleStores(stores);
  }, [mounted]);

  const tensionS = summaries?.tension ?? null;
  const compressionS = summaries?.compression ?? null;
  const bendingS = summaries?.bending ?? null;
  const shearS = summaries?.shear ?? null;

  /** Compact derivation for the at-a-glance grid at the top. */
  const overview = useMemo(() => {
    function row(s: { ok: true; output: CalculationOutput } | { ok: false; error: string } | null, detail?: string) {
      if (!s) return { state: "empty" as const, detail: undefined, utilPct: null };
      if (s.ok) {
        const utilPct =
          s.output.controllingStrength > 0 && Number.isFinite(s.output.demand)
            ? (s.output.demand / s.output.controllingStrength) * 100
            : null;
        return { state: s.output.isSafe ? ("safe" as const) : ("unsafe" as const), detail, utilPct };
      }
      return { state: "empty" as const, detail: undefined, utilPct: null };
    }
    return {
      tension: row(tensionS, tensionS?.ok ? `${tensionS.materialLabel}` : undefined),
      compression: row(
        compressionS,
        compressionS?.ok ? `${compressionS.shapeName} · ${compressionS.materialLabel}` : undefined,
      ),
      bending: row(
        bendingS,
        bendingS?.ok ? `${bendingS.shapeName} · ${bendingS.materialLabel}` : undefined,
      ),
      shear: row(
        shearS,
        shearS?.ok ? `${shearS.shapeName} · ${shearS.materialLabel} · ${shearS.designMethod}` : undefined,
      ),
    };
  }, [tensionS, compressionS, bendingS, shearS]);

  function statusFor(s: { ok: true; output: CalculationOutput } | { ok: false; error: string } | null): {
    status: "safe" | "unsafe" | "empty" | "error";
    errorText?: string;
  } {
    if (!s) return { status: "empty" };
    if (s.ok) return { status: s.output.isSafe ? "safe" : "unsafe" };
    return { status: "empty", errorText: s.error };
  }

  /** Used for the printed cover summary "as of …" line. */
  const printGeneratedAt = useMemo(() => {
    if (!mounted) return null;
    try {
      return new Date().toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return null;
    }
  }, [mounted]);

  return (
    <AppShell>
      {/* Running print-only header / footer — laid out by globals.css under @media print. */}
      <div className="report-print-header" aria-hidden="true">
        <span className="brand">{PRODUCT_BRAND.name}</span>
        <span>Project Summary{printGeneratedAt ? ` · ${printGeneratedAt}` : ""}</span>
      </div>
      <div className="report-print-footer" aria-hidden="true">
        <span className="brand">{PRODUCT_BRAND.shortName}</span>
        <span>For internal review only — verify final designs with a licensed engineer.</span>
      </div>

      <div className="space-y-8 md:space-y-10">
        <ModuleHero
          eyebrow={PRODUCT_BRAND.shortName}
          title={
            <>
              Project{" "}
              <span className="text-[color:var(--foreground)]">Summary</span>
            </>
          }
          description="Snapshot from inputs saved in this browser only. Sections below mirror each calculator (governing case, capacities, demand, status, and steps). Use Print to save as PDF for review."
          chips={[]}
          right={
            <Button variant="primary" size="sm" type="button" onClick={() => window.print()} className="print:hidden">
              Print / Save PDF
            </Button>
          }
          image={{ src: "/assets/combined.png" }}
        />

        {/* Print-only cover sheet: brand title + generated date + four-row status table.
            Renders nothing on screen (display: none in screen.css path). */}
        {mounted ? (
          <section className="report-print-only" style={{ marginBottom: "10pt" }}>
            <h1 style={{ fontSize: "20pt", margin: "0 0 4pt", color: "#0b1220", letterSpacing: "-0.02em" }}>
              {PRODUCT_BRAND.name} — Project Summary
            </h1>
            <p style={{ margin: "0 0 14pt", color: "#475569", fontSize: "10pt" }}>
              {printGeneratedAt ? `Generated ${printGeneratedAt} · ` : ""}snapshot from inputs saved in this browser.
            </p>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                border: "0.75pt solid #cbd5e1",
                fontSize: "10pt",
              }}
            >
              <thead>
                <tr style={{ background: "#f1f5f9" }}>
                  <th style={{ textAlign: "left", padding: "5pt 8pt", borderBottom: "0.75pt solid #cbd5e1", fontWeight: 700 }}>
                    Module
                  </th>
                  <th style={{ textAlign: "left", padding: "5pt 8pt", borderBottom: "0.75pt solid #cbd5e1", fontWeight: 700 }}>
                    Scenario
                  </th>
                  <th style={{ textAlign: "right", padding: "5pt 8pt", borderBottom: "0.75pt solid #cbd5e1", fontWeight: 700 }}>
                    Utilization
                  </th>
                  <th style={{ textAlign: "right", padding: "5pt 8pt", borderBottom: "0.75pt solid #cbd5e1", fontWeight: 700 }}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {(
                  [
                    ["Tension", overview.tension],
                    ["Compression", overview.compression],
                    ["Bending", overview.bending],
                    ["Shear", overview.shear],
                  ] as const
                ).map(([label, ov], idx) => (
                  <tr key={label} style={{ background: idx % 2 === 1 ? "#f8fafc" : "#ffffff" }}>
                    <td style={{ padding: "4pt 8pt", borderTop: "0.5pt solid #e2e8f0", fontWeight: 700 }}>{label}</td>
                    <td style={{ padding: "4pt 8pt", borderTop: "0.5pt solid #e2e8f0", color: "#475569" }}>
                      {ov.detail ?? "—"}
                    </td>
                    <td
                      style={{
                        padding: "4pt 8pt",
                        borderTop: "0.5pt solid #e2e8f0",
                        textAlign: "right",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {ov.utilPct != null && Number.isFinite(ov.utilPct) ? `${ov.utilPct.toFixed(1)}%` : "—"}
                    </td>
                    <td
                      style={{
                        padding: "4pt 8pt",
                        borderTop: "0.5pt solid #e2e8f0",
                        textAlign: "right",
                        fontWeight: 700,
                        color:
                          ov.state === "safe" ? "#065f46" : ov.state === "unsafe" ? "#991b1b" : "#475569",
                      }}
                    >
                      {ov.state === "safe" ? "SAFE" : ov.state === "unsafe" ? "NOT SAFE" : "EMPTY"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}

        {/* At-a-glance status grid + jump links (hidden in print since each section header already shows status). */}
        {mounted ? (
          <Card className="print:hidden">
            <CardBody className="space-y-4">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">At a glance</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    Status snapshot per module — click a card to jump to its section.
                  </p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatusOverviewCard
                  label="Tension"
                  href="#report-tension"
                  state={overview.tension.state}
                  detail={overview.tension.detail}
                  utilPct={overview.tension.utilPct}
                />
                <StatusOverviewCard
                  label="Compression"
                  href="#report-compression"
                  state={overview.compression.state}
                  detail={overview.compression.detail}
                  utilPct={overview.compression.utilPct}
                />
                <StatusOverviewCard
                  label="Bending"
                  href="#report-beam"
                  state={overview.bending.state}
                  detail={overview.bending.detail}
                  utilPct={overview.bending.utilPct}
                />
                <StatusOverviewCard
                  label="Shear"
                  href="#report-shear"
                  state={overview.shear.state}
                  detail={overview.shear.detail}
                  utilPct={overview.shear.utilPct}
                />
              </div>
            </CardBody>
          </Card>
        ) : null}

        <Card className="print:border-0 print:shadow-none">
          <CardBody className="space-y-4 text-sm text-slate-800">
            {!mounted ? (
              <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                <span
                  aria-hidden="true"
                  className="h-3 w-3 animate-pulse rounded-full bg-slate-300"
                />
                <span>Loading saved snapshots from this browser…</span>
              </div>
            ) : (
              <>
                <ReportSection
                  id="report-tension"
                  label="Tension"
                  scenario={tensionS?.ok ? `Material: ${tensionS.materialLabel}` : "Saved snapshot from the Tension module."}
                  scenarioText={tensionS?.ok ? `Material: ${tensionS.materialLabel}` : "No saved snapshot."}
                  status={statusFor(tensionS).status}
                  errorText={statusFor(tensionS).errorText}
                >
                  {tensionS?.ok ? (
                    <div className="space-y-2">
                      <ModuleSummaryStrip output={tensionS.output} />
                      <LimitStatesResultsTable results={tensionS.output.results} />
                      <CalculationStepsTable steps={tensionS.output.steps} title="Calculation steps (AISC D2 / J4.3)" />
                    </div>
                  ) : null}
                </ReportSection>

                <ReportSection
                  id="report-compression"
                  label="Compression"
                  scenario={
                    compressionS?.ok
                      ? `Shape: ${compressionS.shapeName} · Steel: ${compressionS.materialLabel}`
                      : "Saved snapshot from the Compression module."
                  }
                  scenarioText={
                    compressionS?.ok
                      ? `Shape: ${compressionS.shapeName} · Steel: ${compressionS.materialLabel}`
                      : "No saved snapshot."
                  }
                  status={statusFor(compressionS).status}
                  errorText={statusFor(compressionS).errorText}
                  printPageBreak
                >
                  {compressionS?.ok ? (
                    <div className="space-y-2">
                      <ModuleSummaryStrip output={compressionS.output} />
                      <LimitStatesResultsTable results={compressionS.output.results} />
                      <CalculationStepsTable steps={compressionS.output.steps} title="Calculation steps (AISC E3 / local limits)" />
                    </div>
                  ) : null}
                </ReportSection>

                <ReportSection
                  id="report-beam"
                  label="Bending"
                  scenario={
                    bendingS?.ok
                      ? `Shape: ${bendingS.shapeName} (${bendingS.shapeFamilyLabel}) · Steel: ${bendingS.materialLabel}`
                      : "Saved snapshot from the Bending module."
                  }
                  scenarioText={
                    bendingS?.ok
                      ? `Shape: ${bendingS.shapeName} (${bendingS.shapeFamilyLabel}) · Steel: ${bendingS.materialLabel}`
                      : "No saved snapshot."
                  }
                  status={statusFor(bendingS).status}
                  errorText={statusFor(bendingS).errorText}
                  printPageBreak
                >
                  {bendingS?.ok ? (
                    <div className="space-y-2">
                      {bendingS.output.beamLimitStates ? (
                        <BeamLimitStatesBlock
                          beamLimitStates={bendingS.output.beamLimitStates}
                          overallSafe={bendingS.output.isSafe}
                        />
                      ) : (
                        <ModuleSummaryStrip output={bendingS.output} />
                      )}
                      <LimitStatesResultsTable results={bendingS.output.results} />
                      <CalculationStepsTable
                        steps={bendingS.output.steps}
                        title="Calculation steps (AISC F2 / F6 / G2 / deflection)"
                      />
                    </div>
                  ) : null}
                </ReportSection>

                <ReportSection
                  id="report-shear"
                  label="Shear"
                  scenario={
                    shearS?.ok
                      ? `Shape: ${shearS.shapeName} · Steel: ${shearS.materialLabel} · ${shearS.designMethod} · ${
                          shearS.stiffening === "stiffened"
                            ? `stiffened (α = ${shearS.alphaIn?.toFixed(2) ?? "—"} in)`
                            : "unstiffened web"
                        }`
                      : "Saved snapshot from the Shear module."
                  }
                  scenarioText={
                    shearS?.ok
                      ? `Shape: ${shearS.shapeName} · Steel: ${shearS.materialLabel} · ${shearS.designMethod} · ${
                          shearS.stiffening === "stiffened"
                            ? `stiffened (α = ${shearS.alphaIn?.toFixed(2) ?? "—"} in)`
                            : "unstiffened web"
                        }`
                      : "No saved snapshot."
                  }
                  status={statusFor(shearS).status}
                  errorText={statusFor(shearS).errorText}
                  printPageBreak
                >
                  {shearS?.ok ? (
                    <div className="space-y-2">
                      <ModuleSummaryStrip output={shearS.output} />
                      <LimitStatesResultsTable results={shearS.output.results} />
                      <CalculationStepsTable
                        steps={shearS.output.steps}
                        title="Calculation steps (AISC G2 / PROGRAM-2 Shear)"
                      />
                    </div>
                  ) : null}
                </ReportSection>
              </>
            )}
          </CardBody>
        </Card>
      </div>
    </AppShell>
  );
}
