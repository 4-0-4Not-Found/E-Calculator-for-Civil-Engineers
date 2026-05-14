"use client";

import { useEffect, useMemo, useState } from "react";
import {
  asdStrengthUniformLoadKlf,
  lrfdFactoredUniformLoadKlf,
  roundLikeExcel,
  serviceUniformLoadKlf,
} from "@/lib/excel-parity";
import { fmtKipFt, fmtKips } from "@/lib/format/display";
import { flangeWebSlenderness } from "@/lib/limit-state-engine/section-slenderness";
import { aiscShapes } from "@/lib/aisc/data";
import { normalizeSteelMaterialKey, steelMaterialMap, steelMaterials, type SteelMaterialKey } from "@/lib/data/materials";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Field, SelectInput, TextInput } from "@/components/ui/Field";
import { StepsTable } from "@/components/StepsTable";
import { CLIENT_PERSISTENCE } from "@/lib/client-persistence";
import { STORAGE } from "@/lib/storage/keys";
import { AppShell } from "@/components/layout/AppShell";
import { ResultHero } from "@/components/results/ResultHero";
import { UtilizationBar } from "@/components/ui/UtilizationBar";
import { TextInputWithUnit } from "@/components/ui/InputGroup";
import { CalculatorActionRail } from "@/components/actions/CalculatorActionRail";
import { useBrowserDraft } from "@/features/module-runtime/useBrowserDraft";
import { smoothScrollTo } from "@/features/module-runtime/scroll";
import {
  BENDING_ANALYSIS_LOAD_PATTERNS,
  buildExcelBendingAnalysisSnapshot,
  type ShearWorkbookWebStiffening,
} from "@/features/steel/bending/excel-analysis-bending";
import { computeExcelDesignBendingSummary } from "@/features/steel/bending/excel-design-bending";
import { bendingDefaults, bendingDraftSchema, evaluateBending } from "@/features/steel/bending/module-config";
import { ModuleHero } from "@/components/layout/ModuleHero";
import { ModuleDetailsTabs } from "@/components/layout/ModuleDetailsTabs";
import { ModeSwitch } from "@/components/ui/ModeSwitch";
import { formatRelativeTime } from "@/lib/format/relativeTime";

export default function BendingShearPage() {
  const [designMethod, setDesignMethod] = useState<"LRFD" | "ASD">(bendingDefaults.designMethod);
  const [material, setMaterial] = useState<SteelMaterialKey>(bendingDefaults.material as SteelMaterialKey);
  const [shapeName, setShapeName] = useState(bendingDefaults.shapeName);
  const [Mu, setMu] = useState(bendingDefaults.Mu);
  const [Vu, setVu] = useState(bendingDefaults.Vu);
  const [L, setL] = useState(bendingDefaults.L);
  const [wLive, setWLive] = useState(bendingDefaults.wLive);
  const [deadLoadKft, setDeadLoadKft] = useState(bendingDefaults.deadLoadKft);
  const [liveLoadKft, setLiveLoadKft] = useState(bendingDefaults.liveLoadKft);
  const [spanFt, setSpanFt] = useState(bendingDefaults.spanFt);
  const [unbracedLbIn, setUnbracedLbIn] = useState(bendingDefaults.unbracedLbIn);
  const [cbFactor, setCbFactor] = useState(bendingDefaults.cbFactor);
  const [mode, setMode] = useState<"check" | "design">(bendingDefaults.mode);
  const [includeSelfWeight, setIncludeSelfWeight] = useState(bendingDefaults.includeSelfWeight);
  const [bendingAnalysisLoadPattern, setBendingAnalysisLoadPattern] = useState(bendingDefaults.bendingAnalysisLoadPattern);
  const [deflectionLimitDivisor, setDeflectionLimitDivisor] = useState(bendingDefaults.deflectionLimitDivisor);
  const [deflectionBasis, setDeflectionBasis] = useState<"L" | "D+L">(bendingDefaults.deflectionBasis);
  const [shearWebStiffening, setShearWebStiffening] = useState<ShearWorkbookWebStiffening>(bendingDefaults.shearWebStiffening);
  const [shearPanelLengthIn, setShearPanelLengthIn] = useState(bendingDefaults.shearPanelLengthIn);
  const [designCheckDeflection, setDesignCheckDeflection] = useState(bendingDefaults.designCheckDeflection);
  const { saving, savedAt, clearDraft } = useBrowserDraft({
    storageKey: STORAGE.bending,
    savedAtKey: CLIENT_PERSISTENCE.savedAt("bending"),
    schema: bendingDraftSchema,
    hydrate: (p) => {
      if (p.designMethod === "LRFD" || p.designMethod === "ASD") setDesignMethod(p.designMethod);
      if (typeof p.material === "string") setMaterial(normalizeSteelMaterialKey(p.material));
      if (typeof p.shapeName === "string") setShapeName(p.shapeName);
      if (typeof p.Mu === "string") setMu(p.Mu);
      if (typeof p.Vu === "string") setVu(p.Vu);
      if (typeof p.L === "string") setL(p.L);
      if (typeof p.wLive === "string") setWLive(p.wLive);
      if (typeof p.deadLoadKft === "string") setDeadLoadKft(p.deadLoadKft);
      if (typeof p.liveLoadKft === "string") setLiveLoadKft(p.liveLoadKft);
      if (typeof p.spanFt === "string") setSpanFt(p.spanFt);
      if (typeof p.unbracedLbIn === "string") setUnbracedLbIn(p.unbracedLbIn);
      if (typeof p.cbFactor === "string") setCbFactor(p.cbFactor);
      if (p.mode === "check" || p.mode === "design") setMode(p.mode);
      if (typeof p.includeSelfWeight === "boolean") setIncludeSelfWeight(p.includeSelfWeight);
      if (typeof p.bendingAnalysisLoadPattern === "string") setBendingAnalysisLoadPattern(p.bendingAnalysisLoadPattern);
      if (typeof p.deflectionLimitDivisor === "string") setDeflectionLimitDivisor(p.deflectionLimitDivisor);
      if (p.deflectionBasis === "L" || p.deflectionBasis === "D+L") setDeflectionBasis(p.deflectionBasis);
      if (p.shearWebStiffening === "Unstiffened Webs" || p.shearWebStiffening === "Stiffened Webs")
        setShearWebStiffening(p.shearWebStiffening);
      if (typeof p.shearPanelLengthIn === "string") setShearPanelLengthIn(p.shearPanelLengthIn);
      if (typeof p.designCheckDeflection === "boolean") setDesignCheckDeflection(p.designCheckDeflection);
    },
    serialize: () => ({
      designMethod,
      material,
      shapeName,
      Mu,
      Vu,
      L,
      wLive,
      deadLoadKft,
      liveLoadKft,
      spanFt,
      unbracedLbIn,
      cbFactor,
      mode,
      includeSelfWeight,
      bendingAnalysisLoadPattern,
      deflectionLimitDivisor,
      deflectionBasis,
      shearWebStiffening,
      shearPanelLengthIn,
      designCheckDeflection,
    }),
    watch: [
      designMethod,
      material,
      shapeName,
      Mu,
      Vu,
      L,
      wLive,
      deadLoadKft,
      liveLoadKft,
      spanFt,
      unbracedLbIn,
      cbFactor,
      mode,
      includeSelfWeight,
      bendingAnalysisLoadPattern,
      deflectionLimitDivisor,
      deflectionBasis,
      shearWebStiffening,
      shearPanelLengthIn,
      designCheckDeflection,
    ],
  });

  const shape = aiscShapes.find((s) => s.shape === shapeName);
  const mat = steelMaterialMap[material];

  const slenderness = useMemo(() => {
    if (!shape) return null;
    return flangeWebSlenderness(29000, mat.Fy, shape.bf_2tf, shape.h_tw);
  }, [shape, mat]);

  const shapeOptions = useMemo(
    () =>
      mode === "design"
        ? aiscShapes.filter((s) => s.type === "W")
        : aiscShapes.filter((s) => s.type === "W" || s.type === "HSS"),
    [mode],
  );

  useEffect(() => {
    if (mode !== "design") return;
    queueMicrotask(() => {
      setShapeName((prev) => {
        const cur = aiscShapes.find((s) => s.shape === prev);
        if (cur?.type === "HSS") {
          const firstW = aiscShapes.find((s) => s.type === "W");
          return firstW?.shape ?? prev;
        }
        return prev;
      });
    });
  }, [mode]);

  const derivedFromLoads = useMemo(() => {
    const DL = Number(deadLoadKft);
    const LL = Number(liveLoadKft);
    const Lft = Number(spanFt);
    if (!Number.isFinite(DL) || !Number.isFinite(LL) || !Number.isFinite(Lft) || Lft <= 0) return null;
    const wStrengthKlf =
      designMethod === "LRFD" ? lrfdFactoredUniformLoadKlf(DL, LL) : asdStrengthUniformLoadKlf(DL, LL);
    const MuDer = (wStrengthKlf * Lft * Lft) / 8;
    const VuDer = (wStrengthKlf * Lft) / 2;
    /** Service load for deflection: D + L (unfactored) → kip/in. */
    const wServiceKipIn = serviceUniformLoadKlf(DL, LL) / 12;
    const Lin = Lft * 12;
    return { wStrengthKlf, MuDer, VuDer, wServiceKipIn, Lin };
  }, [deadLoadKft, liveLoadKft, spanFt, designMethod]);

  /** Workbook-style: dead/live/span push into M_u, V_u, w, L only in Design (lightest-W search). Analysis uses Member checks only so demands match a typical “known section” sheet tab. */
  useEffect(() => {
    if (mode !== "design") return;
    if (!derivedFromLoads) return;
    queueMicrotask(() => {
      setMu(String(roundLikeExcel(derivedFromLoads.MuDer, 3)));
      setVu(String(roundLikeExcel(derivedFromLoads.VuDer, 3)));
      setWLive(String(roundLikeExcel(derivedFromLoads.wServiceKipIn, 6)));
      setL(String(Math.round(derivedFromLoads.Lin)));
    });
  }, [derivedFromLoads, mode]);

  const out = useMemo(() => {
    if (!shape) return null;
    const useDerivedLoads = mode === "design";
    const Lin = useDerivedLoads ? (derivedFromLoads?.Lin ?? Number(L)) : Number(L);
    const w = useDerivedLoads ? (derivedFromLoads?.wServiceKipIn ?? Number(wLive)) : Number(wLive);
    const muUse = useDerivedLoads ? (derivedFromLoads?.MuDer ?? Number(Mu)) : Number(Mu);
    const vuUse = useDerivedLoads ? (derivedFromLoads?.VuDer ?? Number(Vu)) : Number(Vu);
    const delta = (5 / 384) * w * (Lin ** 4) / (29000 * (shape.Ix || 1));
    const lbParsed = Number(unbracedLbIn);
    const LbUse = unbracedLbIn.trim() !== "" && Number.isFinite(lbParsed) && lbParsed > 0 ? lbParsed : Lin;
    const cbParsed = Number(cbFactor);
    const CbUse = Number.isFinite(cbParsed) && cbParsed > 0 ? cbParsed : 1;
    return evaluateBending({
      designMethod,
      E: 29000,
      Fy: mat.Fy,
      Zx: shape.Zx,
      Sx: shape.Sx,
      Ix: shape.Ix,
      Iy: shape.Iy,
      ry: shape.ry,
      d: shape.d,
      bf: shape.bf,
      tf: shape.tf,
      lambdaFlange: shape.bf_2tf,
      lambdaWeb: shape.h_tw,
      h: shape.h || shape.d - 2 * shape.tf,
      tw: shape.tw,
      a: shape.d,
      isStiffened: false,
      Mu: muUse,
      Vu: vuUse,
      L: Lin,
      wLive: w,
      deflection: delta,
      deflectionAllowable: Lin / 360,
      Lb: LbUse,
      Cb: CbUse,
      sectionProfile: mode === "design" ? "W" : shape.type === "HSS" ? "HSS" : "W",
    });
  }, [shape, mat, Mu, Vu, L, wLive, designMethod, derivedFromLoads, unbracedLbIn, cbFactor, mode]);

  const spanFtResolved = useMemo(() => {
    const fromSpan = Number(spanFt);
    if (Number.isFinite(fromSpan) && fromSpan > 0) return fromSpan;
    const Lin = Number(L);
    if (Number.isFinite(Lin) && Lin > 0) return Lin / 12;
    return null;
  }, [spanFt, L]);

  const excelAnalysis = useMemo(() => {
    if (!shape) return null;
    const Lft = spanFtResolved;
    if (Lft === null) return null;
    const div = Number(deflectionLimitDivisor);
    const divisor = Number.isFinite(div) && div > 0 ? div : 360;
    const D = Number(deadLoadKft);
    const LL = Number(liveLoadKft);
    if (!Number.isFinite(D) || !Number.isFinite(LL)) return null;
    const Lin = Lft * 12;
    const lbParsed = Number(unbracedLbIn);
    const LbUse =
      unbracedLbIn.trim() !== "" && Number.isFinite(lbParsed) && lbParsed > 0 ? lbParsed : Lin;
    const cbParsed = Number(cbFactor);
    const CbUse = Number.isFinite(cbParsed) && cbParsed > 0 ? cbParsed : 1;
    const panelParsed = Number(shearPanelLengthIn);
    const shearPanel =
      shearPanelLengthIn.trim() !== "" && Number.isFinite(panelParsed) && panelParsed > 0 ? panelParsed : null;
    return buildExcelBendingAnalysisSnapshot({
      deadLoadKlf: D,
      liveLoadKlf: LL,
      spanFt: Lft,
      weightPlf: shape.W,
      includeSelfWeight,
      pattern: bendingAnalysisLoadPattern,
      Eksi: 29000,
      Fy: mat.Fy,
      Zx: shape.Zx,
      Sx: shape.Sx,
      lambdaFlangeBf2tf: shape.bf_2tf,
      lambdaWebHtw: shape.h_tw,
      Ix: shape.Ix,
      deflectionSpanDivisor: divisor,
      deflectionBasis,
      LbIn: LbUse,
      Cb: CbUse,
      d: shape.d,
      bf: shape.bf,
      tf: shape.tf,
      tw: shape.tw,
      h: shape.h || shape.d - 2 * shape.tf,
      Iy: shape.Iy,
      ry: shape.ry,
      aiscTypeToken: shape.type,
      shearWebStiffening,
      shearPanelLengthIn: shearPanel,
    });
  }, [
    shape,
    mat.Fy,
    spanFtResolved,
    deadLoadKft,
    liveLoadKft,
    includeSelfWeight,
    bendingAnalysisLoadPattern,
    deflectionLimitDivisor,
    deflectionBasis,
    unbracedLbIn,
    cbFactor,
    shearWebStiffening,
    shearPanelLengthIn,
  ]);

  const excelDesign = useMemo(() => {
    const Lft = spanFtResolved;
    if (Lft === null) return null;
    const D = Number(deadLoadKft);
    const LL = Number(liveLoadKft);
    if (!Number.isFinite(D) || !Number.isFinite(LL)) return null;
    const div = Number(deflectionLimitDivisor);
    const divisor = Number.isFinite(div) && div > 0 ? div : 360;
    return computeExcelDesignBendingSummary({
      Fy: mat.Fy,
      Eksi: 29000,
      deadKlf: D,
      liveKlf: LL,
      spanFt: Lft,
      includeSelfWeight,
      checkDeflection: designCheckDeflection,
      deflectionBasis,
      loadPattern: bendingAnalysisLoadPattern,
      deflectionDivisor: divisor,
      maxList: 25,
    });
  }, [
    spanFtResolved,
    deadLoadKft,
    liveLoadKft,
    mat.Fy,
    includeSelfWeight,
    designCheckDeflection,
    deflectionBasis,
    bendingAnalysisLoadPattern,
    deflectionLimitDivisor,
  ]);

  const suggestion = useMemo(() => {
    if (mode !== "design") return null;
    const Lin = derivedFromLoads?.Lin ?? Number(L);
    const w = derivedFromLoads?.wServiceKipIn ?? Number(wLive);
    const muUse = derivedFromLoads?.MuDer ?? Number(Mu);
    const vuUse = derivedFromLoads?.VuDer ?? Number(Vu);
    const lbParsed = Number(unbracedLbIn);
    const LbUse = unbracedLbIn.trim() !== "" && Number.isFinite(lbParsed) && lbParsed > 0 ? lbParsed : Lin;
    const cbParsed = Number(cbFactor);
    const CbUse = Number.isFinite(cbParsed) && cbParsed > 0 ? cbParsed : 1;
    const div = Number(deflectionLimitDivisor);
    const deflDiv = Number.isFinite(div) && div > 0 ? div : 360;
    const deflAllow = Number.isFinite(Lin) && Lin > 0 ? Lin / deflDiv : Lin / 360;

    const pickShape =
      designMethod === "ASD" ? excelDesign?.lightestAsdShape ?? null : excelDesign?.lightestLrfdShape ?? null;

    if (excelDesign && pickShape) {
      const s = aiscShapes.find((x) => x.shape === pickShape);
      if (s) {
        const delta = (5 / 384) * w * (Lin ** 4) / (29000 * (s.Ix || 1));
        const check = evaluateBending({
          designMethod,
          E: 29000,
          Fy: mat.Fy,
          Zx: s.Zx,
          Sx: s.Sx,
          Ix: s.Ix,
          Iy: s.Iy,
          ry: s.ry,
          d: s.d,
          bf: s.bf,
          tf: s.tf,
          lambdaFlange: s.bf_2tf,
          lambdaWeb: s.h_tw,
          h: s.h || s.d - 2 * s.tf,
          tw: s.tw,
          a: s.d,
          isStiffened: false,
          Mu: muUse,
          Vu: vuUse,
          L: Lin,
          wLive: w,
          deflection: delta,
          deflectionAllowable: deflAllow,
          Lb: LbUse,
          Cb: CbUse,
          sectionProfile: "W",
        });
        return { s, check };
      }
    }

    const candidates = aiscShapes
      .filter((s) => s.type === "W")
      .map((s) => {
        const delta = (5 / 384) * w * (Lin ** 4) / (29000 * (s.Ix || 1));
        const check = evaluateBending({
          designMethod,
          E: 29000,
          Fy: mat.Fy,
          Zx: s.Zx,
          Sx: s.Sx,
          Ix: s.Ix,
          Iy: s.Iy,
          ry: s.ry,
          d: s.d,
          bf: s.bf,
          tf: s.tf,
          lambdaFlange: s.bf_2tf,
          lambdaWeb: s.h_tw,
          h: s.h || s.d - 2 * s.tf,
          tw: s.tw,
          a: s.d,
          isStiffened: false,
          Mu: muUse,
          Vu: vuUse,
          L: Lin,
          wLive: w,
          deflection: delta,
          deflectionAllowable: deflAllow,
          Lb: LbUse,
          Cb: CbUse,
          sectionProfile: "W",
        });
        return { s, check };
      })
      .filter((c) => c.check.isSafe)
      .sort((a, b) => a.s.W - b.s.W);
    return candidates[0] ?? null;
  }, [
    mode,
    Mu,
    Vu,
    mat,
    L,
    wLive,
    designMethod,
    derivedFromLoads,
    unbracedLbIn,
    cbFactor,
    excelDesign,
    deflectionLimitDivisor,
  ]);

  useEffect(() => {
    if (mode !== "design") return;
    if (!suggestion) return;
    queueMicrotask(() => setShapeName(suggestion.s.shape));
  }, [mode, suggestion]);

  const resetInputs = () => {
    clearDraft();
    setDesignMethod(bendingDefaults.designMethod);
    setMaterial(bendingDefaults.material as SteelMaterialKey);
    setShapeName(bendingDefaults.shapeName);
    setMu(bendingDefaults.Mu);
    setVu(bendingDefaults.Vu);
    setL(bendingDefaults.L);
    setWLive(bendingDefaults.wLive);
    setDeadLoadKft(bendingDefaults.deadLoadKft);
    setLiveLoadKft(bendingDefaults.liveLoadKft);
    setSpanFt(bendingDefaults.spanFt);
    setUnbracedLbIn(bendingDefaults.unbracedLbIn);
    setCbFactor(bendingDefaults.cbFactor);
    setMode(bendingDefaults.mode);
    setIncludeSelfWeight(bendingDefaults.includeSelfWeight);
    setBendingAnalysisLoadPattern(bendingDefaults.bendingAnalysisLoadPattern);
    setDeflectionLimitDivisor(bendingDefaults.deflectionLimitDivisor);
    setDeflectionBasis(bendingDefaults.deflectionBasis);
    setShearWebStiffening(bendingDefaults.shearWebStiffening);
    setShearPanelLengthIn(bendingDefaults.shearPanelLengthIn);
    setDesignCheckDeflection(bendingDefaults.designCheckDeflection);
  };

  const invalid = (v: string, min = 0, allowBlank = false) => {
    if (allowBlank && v.trim() === "") return false;
    const n = Number(v);
    return !Number.isFinite(n) || n < min;
  };

  const [detailsTab, setDetailsTab] = useState<"steps" | "strengths" | "states" | "analysis" | "design">("states");

  return (
    <AppShell>
      <div className="space-y-8 md:space-y-10">
        <ModuleHero
          eyebrow="steel module"
          title="Bending"
          description="Simply supported strong axis: rolled W-shapes (full F6/F2) or rectangular HSS (approximate limits in-engine). Design mode suggests lightest W only. Inputs save in this browser."
          chips={[
            { key: "saved", label: saving ? "Saving…" : savedAt ? `Saved ${formatRelativeTime(savedAt) ?? "recently"}` : "Not saved yet" },
            { key: "mat", label: steelMaterialMap[material].key },
            { key: "method", label: designMethod },
            { key: "mode", label: mode === "design" ? "Design mode" : "Analysis mode" },
          ]}
          image={{ src: "/assets/bending.png" }}
        />

        <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
          <div className="space-y-6 lg:col-span-7">
            <ModeSwitch
              value={mode}
              onChange={setMode}
              description="Switch any time — your inputs stay saved on this device."
            />
            <Card id="beam-general">
              <CardHeader
                title="General"
                description="Steel, member selection, and method."
                right={<Badge tone={mode === "design" ? "info" : "neutral"}>{mode === "design" ? "Design mode" : "Analysis mode"}</Badge>}
              />
              <CardBody>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Steel Type" hint="Fy and Fu (ksi) from the material table.">
                    <SelectInput value={material} onChange={(v) => setMaterial(v as SteelMaterialKey)}>
                      {steelMaterials.map((m) => (
                        <option key={m.key} value={m.key}>
                          {m.label} (Fy={m.Fy}, Fu={m.Fu})
                        </option>
                      ))}
                    </SelectInput>
                  </Field>
                  {mode === "check" ? (
                    <Field
                      label="Member (W or HSS)"
                      hint="AISC v16. HSS uses simplified assumptions; verify critical members with AISC F7."
                    >
                      <SelectInput value={shapeName} onChange={setShapeName}>
                        {shapeOptions.map((s) => (
                          <option key={s.shape} value={s.shape}>
                            {s.shape}
                          </option>
                        ))}
                      </SelectInput>
                    </Field>
                  ) : (
                    <Field label="Recommended W-shape" hint="Lightest passing W (auto-selected).">
                      <div className="rounded-2xl bg-[color:var(--surface-2)] px-3 py-2 text-sm font-semibold ring-1 ring-inset ring-[color:var(--border)]/60">
                        {suggestion ? suggestion.s.shape : "No passing section found"}
                      </div>
                    </Field>
                  )}
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <Field label="Design method" hint="LRFD or ASD strength reduction.">
                    <SelectInput value={designMethod} onChange={(v) => setDesignMethod(v as "LRFD" | "ASD")}>
                      <option value="LRFD">LRFD</option>
                      <option value="ASD">ASD</option>
                    </SelectInput>
                  </Field>
                </div>

                {shape ? (
                  <div className="mt-4 rounded-2xl bg-[color:var(--surface-2)] px-4 py-3 ring-1 ring-inset ring-[color:var(--border)]/60">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--muted)]">Section properties</p>
                      <Badge tone="info">{shape.shape}</Badge>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs font-semibold text-[color:var(--muted)] sm:grid-cols-4">
                      <span className="tabular-nums">W: {shape.W.toFixed(1)} plf</span>
                      <span className="tabular-nums">Zx: {shape.Zx.toFixed(1)} in³</span>
                      <span className="tabular-nums">Ix: {shape.Ix.toFixed(1)} in⁴</span>
                      <span className="tabular-nums">ry: {shape.ry.toFixed(2)} in</span>
                    </div>
                  </div>
                ) : null}
              </CardBody>
            </Card>

            {slenderness ? (
              <Card className="shadow-none border border-slate-200 bg-white">
                <CardBody className="space-y-3 text-sm text-slate-800">
                  <p className="text-base font-semibold text-slate-900">Local buckling (AISC Table B4.1)</p>
                  <p className="text-slate-600">
                    Compare section slenderness λ to λ_p (compact) and λ_r from the AISC v16 shape you selected (E = 29 000 ksi).
                  </p>
                  <div className="grid gap-2 rounded-lg bg-slate-50 p-3 md:grid-cols-2">
                    <div>
                      <p className="font-semibold">{slenderness.flange.label}</p>
                      <p>λ = {slenderness.flange.lambda.toFixed(2)}, λ_p = {slenderness.flange.lambdaP.toFixed(3)}, λ_r = {slenderness.flange.lambdaR.toFixed(3)}</p>
                      <p className="text-slate-900">→ {slenderness.flange.class}</p>
                    </div>
                    <div>
                      <p className="font-semibold">{slenderness.web.label}</p>
                      <p>λ = {slenderness.web.lambda.toFixed(2)}, λ_p = {slenderness.web.lambdaP.toFixed(3)}, λ_r = {slenderness.web.lambdaR.toFixed(3)}</p>
                      <p className="text-slate-900">→ {slenderness.web.class}</p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ) : null}

            <Card id="beam-loads">
              <CardHeader title="Loads" description="Option A: dead/live/span → auto-derive M, V, service w. Option B: enter M, V, w manually." />
              <CardBody>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Dead load w_D" hint="Uniform dead load (kips per ft).">
                    <TextInputWithUnit value={deadLoadKft} onChange={setDeadLoadKft} unit="k/ft" placeholder="e.g. 0.8" inputMode="decimal" />
                  </Field>
                  <Field label="Live load w_L" hint="Uniform live load (kips per ft).">
                    <TextInputWithUnit value={liveLoadKft} onChange={setLiveLoadKft} unit="k/ft" placeholder="e.g. 3.2" inputMode="decimal" />
                  </Field>
                  <Field label="Span" hint="Feet (converts to L in inches).">
                    <TextInputWithUnit
                      value={spanFt}
                      onChange={(v) => {
                        setSpanFt(v);
                        const ft = Number(v);
                        if (Number.isFinite(ft) && ft > 0) setL(String(ft * 12));
                      }}
                      unit="ft"
                      placeholder="e.g. 30"
                    />
                  </Field>
                </div>

                {derivedFromLoads ? (
                  <Card className="mt-4 border-[color:var(--brand)]/20 bg-[color:var(--brand)]/5">
                    <CardBody className="space-y-1 text-sm text-slate-900">
                      <p className="font-bold">Derived from your loads ({designMethod})</p>
                      <p className="tabular-nums">
                        w for strength = {derivedFromLoads.wStrengthKlf.toFixed(3)} k/ft
                        {designMethod === "LRFD"
                          ? ` (LRFD — governs: ${
                              1.4 * (Number(deadLoadKft) || 0) >=
                              1.2 * (Number(deadLoadKft) || 0) + 1.6 * (Number(liveLoadKft) || 0)
                                ? "1.4D"
                                : "1.2D + 1.6L"
                            })`
                          : " (ASD: D + L)"}
                      </p>
                      <p className="tabular-nums">
                        M_u = {derivedFromLoads.MuDer.toFixed(3)} kip·ft · V_u = {derivedFromLoads.VuDer.toFixed(3)} kips
                      </p>
                      <p className="tabular-nums">Service w for deflection (D+L) = {derivedFromLoads.wServiceKipIn.toFixed(4)} kip/in</p>
                    </CardBody>
                  </Card>
                ) : null}
              </CardBody>
            </Card>

            <Card id="beam-check">
              <CardHeader title="Member checks" description="Enter demands directly (or use Loads above). L is inches for analysis." />
              <CardBody>
                <div className="grid gap-4 md:grid-cols-2">
                <Field label="M_u" hint="Required flexural strength (kip·ft). Filled automatically when dead/live/span are set.">
                  <TextInputWithUnit value={Mu} onChange={setMu} unit="kip·ft" inputMode="decimal" />
                </Field>
                <Field label="V_u" hint="Required shear (kips).">
                  <TextInputWithUnit value={Vu} onChange={setVu} unit="kips" inputMode="decimal" />
                </Field>
                <Field label="Span L" hint="Span in inches." error={invalid(L, 0) ? "Enter a number ≥ 0." : undefined}>
                  <TextInputWithUnit value={L} onChange={setL} unit="in" inputMode="decimal" />
                </Field>
                <Field
                  label="Unbraced L_b (LTB)"
                  hint="Inches along the beam between points braced against twist/lateral displacement. Leave blank to use span L (fully unbraced)."
                  error={invalid(unbracedLbIn, 0, true) ? "Enter a number ≥ 0, or leave blank." : undefined}
                >
                  <TextInputWithUnit value={unbracedLbIn} onChange={setUnbracedLbIn} unit="in" placeholder="default = span" inputMode="decimal" />
                </Field>
                <Field
                  label="C_b (moment gradient)"
                  hint="AISC F1. Uniform moment 1.0; uniform load on simple span ≈ 1.14; others per Table 3-2."
                  error={invalid(cbFactor, 0) ? "Enter a number > 0." : undefined}
                >
                  <TextInput value={cbFactor} onChange={setCbFactor} />
                </Field>
                <Field label="Service w for deflection" hint="Uniform service load in kip/in — with D/L/span above, uses (D+L)/12; manual mode: enter (D+L)/12 or your Excel convention.">
                  <TextInputWithUnit value={wLive} onChange={setWLive} unit="kip/in" inputMode="decimal" />
                </Field>
                </div>
              </CardBody>
            </Card>

            {suggestion ? (
              <Card className="border-slate-300 bg-white">
                <CardBody>
                  <p className="text-sm font-semibold uppercase tracking-wide text-slate-800">Suggested section (lowest weight W that passes)</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{suggestion.s.shape}</p>
                  <p className="mt-1 text-base font-medium text-slate-800">
                    {suggestion.s.W} lb/ft, Zx = {suggestion.s.Zx.toFixed(1)} in³
                  </p>
                </CardBody>
              </Card>
            ) : null}

          </div>

          <div className="space-y-4 lg:col-span-5 lg:sticky lg:top-28">
            <div id="results">
              {out ? (
                <ResultHero
                  status={out.governingCase === "geometry_error" ? "invalid" : out.isSafe ? "safe" : "unsafe"}
                  governing={out.beamLimitStates?.governing ?? out.governingCase}
                  capacityLabel={out.beamLimitStates ? "Max utilization" : "Capacity"}
                  capacity={
                    out.beamLimitStates
                      ? `${(
                          Math.max(
                            out.beamLimitStates.bending.ratio,
                            out.beamLimitStates.shear.ratio,
                            out.beamLimitStates.deflection.ratio,
                          ) * 100
                        ).toFixed(1)}%`
                      : fmtKips(out.controllingStrength)
                  }
                  demandLabel={out.beamLimitStates ? "Demand (overall)" : "Demand"}
                  demand={fmtKips(out.demand)}
                  utilization={
                    out.beamLimitStates
                      ? Math.max(
                          out.beamLimitStates.bending.ratio,
                          out.beamLimitStates.shear.ratio,
                          out.beamLimitStates.deflection.ratio,
                        )
                      : out.controllingStrength > 0
                        ? out.demand / out.controllingStrength
                        : undefined
                  }
                  metaRight={<Badge tone="info">{mat.key}</Badge>}
                />
              ) : (
                <ResultHero
                  status="invalid"
                  governing="Enter inputs to evaluate"
                  capacityLabel="Capacity"
                  capacity="—"
                  demandLabel="Demand"
                  demand="—"
                  metaRight={<Badge tone="info">{mat.key}</Badge>}
                />
              )}
            </div>

            <CalculatorActionRail
              title="Actions"
              subtitle={`${shapeName} · ${designMethod} · ${mode === "design" ? "Design mode" : "Analysis mode"}`}
              savedKey={CLIENT_PERSISTENCE.savedAt("bending")}
              saving={saving}
              savedAt={savedAt}
              compare={{
                storageKey: CLIENT_PERSISTENCE.compareSnapshot("beam"),
                getCurrent: () => {
                  const gov = out?.beamLimitStates?.governing ?? out?.governingCase ?? "—";
                  const lines: string[] = [
                    `Method: ${designMethod} · Material: ${mat.key} · Mode: ${mode}`,
                    `Shape: ${shapeName}`,
                    `Mu: ${Mu} kip-ft · Vu: ${Vu} kips · L: ${L} in`,
                    `Governing: ${String(gov)}`,
                  ];
                  if (out?.beamLimitStates) {
                    lines.push(
                      `Bending ratio: ${(out.beamLimitStates.bending.ratio * 100).toFixed(1)}%`,
                      `Shear ratio: ${(out.beamLimitStates.shear.ratio * 100).toFixed(1)}%`,
                      `Deflection ratio: ${(out.beamLimitStates.deflection.ratio * 100).toFixed(1)}%`,
                    );
                  } else if (out) {
                    lines.push(`Capacity: ${fmtKips(out.controllingStrength)} · Demand: ${fmtKips(out.demand)}`);
                  }
                  return { title: `Bending — ${shapeName}`, lines };
                },
              }}
              copyText={() => {
                if (!out) return "Bending — No results";
                const lines = [
                  "Bending",
                  `Method: ${designMethod}`,
                  `Material: ${mat.key}`,
                  `Shape: ${shapeName}`,
                  `Governing: ${out.beamLimitStates?.governing ?? out.governingCase}`,
                  `Demand: ${fmtKips(out.demand)}`,
                ];
                if (out.beamLimitStates) {
                  lines.push(
                    `Bending ratio: ${(out.beamLimitStates.bending.ratio * 100).toFixed(1)}%`,
                    `Shear ratio: ${(out.beamLimitStates.shear.ratio * 100).toFixed(1)}%`,
                    `Deflection ratio: ${(out.beamLimitStates.deflection.ratio * 100).toFixed(1)}%`,
                  );
                } else {
                  lines.push(`Capacity: ${fmtKips(out.controllingStrength)}`);
                }
                return lines.join("\n");
              }}
              onGoResults={() => smoothScrollTo("results")}
              onGoSteps={() => {
                setDetailsTab("steps");
                smoothScrollTo("details");
              }}
              saveSlots={{
                moduleKey: "bending",
                draftStorageKey: STORAGE.bending,
                getCurrent: () => ({
                  designMethod,
                  material,
                  shapeName,
                  Mu,
                  Vu,
                  L,
                  wLive,
                  deadLoadKft,
                  liveLoadKft,
                  spanFt,
                  unbracedLbIn,
                  cbFactor,
                  mode,
                  includeSelfWeight,
                  bendingAnalysisLoadPattern,
                  deflectionLimitDivisor,
                  deflectionBasis,
                  shearWebStiffening,
                  shearPanelLengthIn,
                  designCheckDeflection,
                }),
              }}
              onReset={resetInputs}
            />
          </div>
        </div>

        {out ? (
          <ModuleDetailsTabs
            title="Details"
            description="Limit states, workbook Analysis, workbook Design (Bending), strengths, and steps."
            value={detailsTab}
            onChange={setDetailsTab}
            tabs={[
              {
                id: "states",
                label: "Limit states",
                panel: out.beamLimitStates ? (
                  <Card>
                    <CardHeader title="Limit states (utilization)" description="Demand/capacity ratios by check." />
                    <CardBody className="space-y-3">
                      <LimitRow
                        title="Bending"
                        demand={out.beamLimitStates.bending.demand}
                        capacity={out.beamLimitStates.bending.capacity}
                        ratio={out.beamLimitStates.bending.ratio}
                        unit={out.beamLimitStates.bending.unit}
                      />
                      <LimitRow
                        title={`Shear (${out.beamLimitStates.shear.cvCase}, C_v = ${out.beamLimitStates.shear.cv.toFixed(4)})`}
                        demand={out.beamLimitStates.shear.demand}
                        capacity={out.beamLimitStates.shear.capacity}
                        ratio={out.beamLimitStates.shear.ratio}
                        unit={out.beamLimitStates.shear.unit}
                      />
                      <LimitRow
                        title={
                          deadLoadKft.trim() && liveLoadKft.trim() && spanFt.trim()
                            ? "Deflection (service D+L)"
                            : "Deflection (service w)"
                        }
                        demand={out.beamLimitStates.deflection.demand}
                        capacity={out.beamLimitStates.deflection.capacity}
                        ratio={out.beamLimitStates.deflection.ratio}
                        unit={out.beamLimitStates.deflection.unit}
                      />
                    </CardBody>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader title="Limit states" description="Not available for this configuration." />
                    <CardBody className="text-sm text-[color:var(--muted)]">—</CardBody>
                  </Card>
                ),
              },
              {
                id: "analysis",
                label: "Analysis",
                panel: (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader
                        title="Workbook inputs (Bending + Shear tabs)"
                        description="Bending: I26, L24, deflection E16/F19. Shear: B19, E16 (panel length in.). L_b and C_b use Member checks above. Saved with your draft."
                      />
                      <CardBody>
                        <div className="grid gap-4 md:grid-cols-2">
                          <Field label="Include self-weight" hint="Workbook L24 — adds member weight (plf ÷ 1000) to dead load for E27 / G27.">
                            <SelectInput
                              value={includeSelfWeight ? "Yes" : "No"}
                              onChange={(v) => setIncludeSelfWeight(v === "Yes")}
                            >
                              <option value="Yes">Yes</option>
                              <option value="No">No</option>
                            </SelectInput>
                          </Field>
                          <Field label="Load pattern" hint="Workbook I26 / I25 — XLOOKUP key for bending rows C65:C69 and shear C70:C74 (same labels).">
                            <SelectInput value={bendingAnalysisLoadPattern} onChange={setBendingAnalysisLoadPattern}>
                              {BENDING_ANALYSIS_LOAD_PATTERNS.map((p) => (
                                <option key={p} value={p}>
                                  {p}
                                </option>
                              ))}
                            </SelectInput>
                          </Field>
                          <Field label="Deflection limit" hint="Workbook E16 style — allowable δ = (span ft ÷ divisor) × 12 in.">
                            <TextInputWithUnit
                              value={deflectionLimitDivisor}
                              onChange={setDeflectionLimitDivisor}
                              unit="span ÷"
                              placeholder="360"
                              inputMode="numeric"
                            />
                          </Field>
                          <Field label="Deflection basis" hint="Workbook F19 — live-only column L vs D+L column M.">
                            <SelectInput value={deflectionBasis} onChange={(v) => setDeflectionBasis(v as "L" | "D+L")}>
                              <option value="L">Live load only (Δ(L))</option>
                              <option value="D+L">Dead + live (Δ(D+L))</option>
                            </SelectInput>
                          </Field>
                          <Field label="Shear web (Analysis (Shear) B19)" hint="Unstiffened uses H32 path; stiffened uses H33–H35 for k_v.">
                            <SelectInput
                              value={shearWebStiffening}
                              onChange={(v) => setShearWebStiffening(v as ShearWorkbookWebStiffening)}
                            >
                              <option value="Unstiffened Webs">Unstiffened webs</option>
                              <option value="Stiffened Webs">Stiffened webs</option>
                            </SelectInput>
                          </Field>
                          <Field
                            label="Shear panel length E16 (in)"
                            hint="Blank = span in inches (K61×12). Used with web depth for H33 = E16/E17."
                          >
                            <TextInputWithUnit
                              value={shearPanelLengthIn}
                              onChange={setShearPanelLengthIn}
                              unit="in"
                              placeholder="default = span L"
                              inputMode="decimal"
                            />
                          </Field>
                        </div>
                      </CardBody>
                    </Card>

                    {excelAnalysis ? (
                      <Card>
                        <CardHeader
                          title="Workbook calculations"
                          description="Bending tab: loads (E26–G28), pattern H–M, F6 (E37–E48), deflection. F2 LTB + min(F6,F2) match the main engine. Shear tab: G31–H36, D40–L46, E50, E56/E57, J56/J57."
                        />
                        <CardBody className="space-y-4 text-sm text-slate-800">
                          <p className="text-xs text-slate-600">
                            Rows labeled E46–E48 follow the spreadsheet flexure line (φM_n from F6 flange local buckling only). Additional rows add AISC F2 LTB and the program’s Analysis (Shear) G2 block using your section and pattern shears.
                          </p>
                          <div className="grid gap-2 rounded-lg bg-slate-50 p-3 md:grid-cols-2">
                            <WorkbookRow label="w_u (factored, used)" value={`${excelAnalysis.wFactoredUsedKlf.toFixed(3)} k/ft`} />
                            <WorkbookRow label="w_s (service, used)" value={`${excelAnalysis.wServiceUsedKlf.toFixed(3)} k/ft`} />
                            <WorkbookRow label="w_u without sw (E26)" value={`${excelAnalysis.wFactoredNoSwKlf.toFixed(3)} k/ft`} />
                            <WorkbookRow label="w_u with sw (E27)" value={`${excelAnalysis.wFactoredWithSwKlf.toFixed(3)} k/ft`} />
                            <WorkbookRow label="Self-weight (L16/1000)" value={`${excelAnalysis.selfWeightKlf.toFixed(3)} k/ft`} />
                            <WorkbookRow label="Span (K61)" value={`${spanFtResolved?.toFixed(2) ?? "—"} ft`} />
                          </div>
                          <div className="rounded-lg border border-slate-200 bg-white p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Selected pattern row</p>
                            <p className="mt-1 text-xs text-slate-600">{excelAnalysis.patternLabel}</p>
                            <div className="mt-2 grid gap-1 tabular-nums md:grid-cols-2">
                              <WorkbookRow label="V_u (factored)" value={fmtKips(excelAnalysis.pattern.VfactoredKips)} />
                              <WorkbookRow label="V_s (service)" value={fmtKips(excelAnalysis.pattern.VserviceKips)} />
                              <WorkbookRow label="M_u (factored)" value={fmtKipFt(excelAnalysis.pattern.MfactoredKipFt)} />
                              <WorkbookRow label="M_s (service)" value={fmtKipFt(excelAnalysis.pattern.MserviceKipFt)} />
                              <WorkbookRow label="δ live (L65 family)" value={`${excelAnalysis.pattern.deflectionLiveIn.toFixed(5)} in`} />
                              <WorkbookRow label="δ D+L (M65 family)" value={`${excelAnalysis.pattern.deflectionDlPlusLIn.toFixed(5)} in`} />
                            </div>
                          </div>
                          <div className="rounded-lg border border-slate-200 bg-white p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">F6 flange local buckling</p>
                            <div className="mt-2 grid gap-1 tabular-nums md:grid-cols-2">
                              <WorkbookRow label="λ_f / λ_pf / λ_rf" value={`${excelAnalysis.flb.lambdaF.toFixed(2)} / ${excelAnalysis.flb.lambdaPf.toFixed(3)} / ${excelAnalysis.flb.lambdaRf.toFixed(3)}`} />
                              <WorkbookRow label="k_c (L40)" value={excelAnalysis.flb.kc.toFixed(4)} />
                              <WorkbookRow label="Class (F40)" value={excelAnalysis.flb.flangeClass} />
                              <WorkbookRow label="M_p (E37)" value={fmtKipFt(excelAnalysis.flb.MpKipFt)} />
                              <WorkbookRow label="M_n FLB (E45)" value={fmtKipFt(excelAnalysis.flb.MnKipFt)} />
                            </div>
                          </div>
                          <div className="rounded-lg border border-slate-200 bg-white p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">F2 LTB (AISC; L_b, C_b from Member checks)</p>
                            <div className="mt-2 grid gap-1 tabular-nums md:grid-cols-2">
                              <WorkbookRow label="L_p (in)" value={excelAnalysis.ltb.LpIn.toFixed(2)} />
                              <WorkbookRow label="L_r (in)" value={excelAnalysis.ltb.LrIn.toFixed(2)} />
                              <WorkbookRow label="M_n LTB" value={fmtKipFt(excelAnalysis.ltb.MnLtbKipFt)} />
                              <WorkbookRow label="min(M_n FLB, M_n LTB)" value={fmtKipFt(excelAnalysis.ltb.MnMinFlbLtbKipFt)} />
                              <WorkbookRow label="Governs" value={excelAnalysis.ltb.flexureControl} />
                            </div>
                          </div>
                          <div className="rounded-lg border border-slate-200 bg-white p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Analysis (Shear) — G2</p>
                            <div className="mt-2 grid gap-1 tabular-nums md:grid-cols-2">
                              <WorkbookRow label="k_v (H36)" value={excelAnalysis.shear.H36.toFixed(4)} />
                              <WorkbookRow label="λ h/t_w (D40)" value={excelAnalysis.shear.lambdaWeb.toFixed(2)} />
                              <WorkbookRow label="Shear case (M41)" value={String(excelAnalysis.shear.shearCase)} />
                              <WorkbookRow label="C_v (L46)" value={excelAnalysis.shear.Cv.toFixed(4)} />
                              <WorkbookRow label="V_n (E50)" value={fmtKips(excelAnalysis.shear.VnKips)} />
                              <WorkbookRow label="φ_v (E46)" value={String(excelAnalysis.shear.phiLrfd)} />
                              <WorkbookRow label="φV_n (E56)" value={fmtKips(excelAnalysis.shear.phiVnKips)} />
                              <WorkbookRow label="V_n/Ω (J56)" value={fmtKips(excelAnalysis.shear.vnOverOmegaKips)} />
                              <WorkbookRow label="Ω_v (I46)" value={String(excelAnalysis.shear.omegaAsd)} />
                            </div>
                            <div className="mt-3 grid gap-2 md:grid-cols-2">
                              <div>
                                <p className="text-xs font-semibold text-slate-700">LRFD shear (E56 vs E57)</p>
                                <p className="tabular-nums text-slate-900">φV_n = {fmtKips(excelAnalysis.shear.phiVnKips)}</p>
                                <p className="tabular-nums text-slate-800">V_u = {fmtKips(excelAnalysis.shear.VuKips)}</p>
                                <div className="mt-1">
                                  <Badge tone={excelAnalysis.shear.shearLrfdSafe ? "good" : "bad"}>
                                    {excelAnalysis.shear.shearLrfdSafe ? "Safe" : "Unsafe"}
                                  </Badge>
                                </div>
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-slate-700">ASD shear (J56 vs J57)</p>
                                <p className="tabular-nums text-slate-900">V_n/Ω = {fmtKips(excelAnalysis.shear.vnOverOmegaKips)}</p>
                                <p className="tabular-nums text-slate-800">V_s = {fmtKips(excelAnalysis.shear.VsKips)}</p>
                                <div className="mt-1">
                                  <Badge tone={excelAnalysis.shear.shearAsdSafe ? "good" : "bad"}>
                                    {excelAnalysis.shear.shearAsdSafe ? "Safe" : "Unsafe"}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="grid gap-3 md:grid-cols-2">
                            <div className="rounded-lg border border-slate-200 bg-white p-3">
                              <p className="text-xs font-semibold text-slate-700">LRFD flexure min(F6,F2)</p>
                              <p className="mt-1 tabular-nums text-slate-900">φM_n = {fmtKipFt(excelAnalysis.flexureFlbLtbLrfd.phiMnKipFt)}</p>
                              <p className="tabular-nums text-slate-800">M_u = {fmtKipFt(excelAnalysis.flexureFlbLtbLrfd.demandKipFt)}</p>
                              <div className="mt-2">
                                <Badge tone={excelAnalysis.flexureFlbLtbLrfd.safe ? "good" : "bad"}>
                                  {excelAnalysis.flexureFlbLtbLrfd.safe ? "Safe" : "Unsafe"}
                                </Badge>
                              </div>
                            </div>
                            <div className="rounded-lg border border-slate-200 bg-white p-3">
                              <p className="text-xs font-semibold text-slate-700">ASD flexure min(F6,F2)</p>
                              <p className="mt-1 tabular-nums text-slate-900">M_n/Ω = {fmtKipFt(excelAnalysis.flexureFlbLtbAsd.mnOverOmegaKipFt)}</p>
                              <p className="tabular-nums text-slate-800">M_s = {fmtKipFt(excelAnalysis.flexureFlbLtbAsd.demandKipFt)}</p>
                              <div className="mt-2">
                                <Badge tone={excelAnalysis.flexureFlbLtbAsd.safe ? "good" : "bad"}>
                                  {excelAnalysis.flexureFlbLtbAsd.safe ? "Safe" : "Unsafe"}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="grid gap-3 md:grid-cols-3">
                            <div className="rounded-lg border border-slate-200 bg-white p-3">
                              <p className="text-xs font-semibold text-slate-700">LRFD (E46–E48)</p>
                              <p className="mt-1 tabular-nums text-slate-900">φM_n = {fmtKipFt(excelAnalysis.phiMnLrfdKipFt)}</p>
                              <p className="tabular-nums text-slate-800">M_req = {fmtKipFt(excelAnalysis.MrLrfdKipFt)}</p>
                              <div className="mt-2">
                                <Badge tone={excelAnalysis.flexureLrfdSafe ? "good" : "bad"}>
                                  {excelAnalysis.flexureLrfdSafe ? "Safe" : "Unsafe"}
                                </Badge>
                              </div>
                            </div>
                            <div className="rounded-lg border border-slate-200 bg-white p-3">
                              <p className="text-xs font-semibold text-slate-700">ASD flexure (J46–J48)</p>
                              <p className="mt-1 tabular-nums text-slate-900">M_n/Ω = {fmtKipFt(excelAnalysis.mnOverOmegaKipFt)}</p>
                              <p className="tabular-nums text-slate-800">M_s = {fmtKipFt(excelAnalysis.MsAsdKipFt)}</p>
                              <div className="mt-2">
                                <Badge tone={excelAnalysis.flexureAsdSafe ? "good" : "bad"}>
                                  {excelAnalysis.flexureAsdSafe ? "Safe" : "Unsafe"}
                                </Badge>
                              </div>
                            </div>
                            <div className="rounded-lg border border-slate-200 bg-white p-3">
                              <p className="text-xs font-semibold text-slate-700">Deflection (D17 vs L33)</p>
                              <p className="mt-1 tabular-nums text-slate-900">Allowable = {excelAnalysis.deflectionAllowableIn.toFixed(4)} in</p>
                              <p className="tabular-nums text-slate-800">
                                Demand ({excelAnalysis.deflectionBasis === "L" ? "live" : "D+L"}) = {excelAnalysis.deflectionDemandIn.toFixed(5)} in
                              </p>
                              <div className="mt-2">
                                <Badge tone={excelAnalysis.deflectionSafe ? "good" : "bad"}>
                                  {excelAnalysis.deflectionSafe ? "Safe" : "Unsafe"}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    ) : (
                      <Card>
                        <CardHeader title="Analysis (Bending)" description="Enter a valid span (ft in Loads, or L in inches) to mirror the workbook demand table." />
                        <CardBody className="text-sm text-[color:var(--muted)]">
                          Workbook rows H65–M69 need span K61 (feet). Add span under Loads or set L (in) in Member checks.
                        </CardBody>
                      </Card>
                    )}
                  </div>
                ),
              },
              {
                id: "design",
                label: "Design",
                panel: (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader
                        title="Design (Bending) — workbook inputs"
                        description="Uses the same loads, span, self-weight, load pattern, and deflection controls as the Analysis tab. R9 toggles the deflection gate (CC/CI). Saved with your draft."
                      />
                      <CardBody>
                        <div className="grid gap-4 md:grid-cols-2">
                          <Field label="Check deflection (R9)" hint="No = workbook always treats CC/CI as Safe (skip δ check).">
                            <SelectInput
                              value={designCheckDeflection ? "Yes" : "No"}
                              onChange={(v) => setDesignCheckDeflection(v === "Yes")}
                            >
                              <option value="Yes">Yes</option>
                              <option value="No">No</option>
                            </SelectInput>
                          </Field>
                          <Field label="BZ load code" hint="From Sheet4 Q26:R30 via your load pattern (read-only).">
                            <div className="rounded-2xl bg-[color:var(--surface-2)] px-3 py-2 text-sm font-semibold ring-1 ring-inset ring-[color:var(--border)]/60 tabular-nums">
                              {excelDesign ? String(excelDesign.bzCode) : "—"}
                            </div>
                          </Field>
                        </div>
                        <p className="mt-3 text-xs text-slate-600">
                          Rows 9–732: F6 flange nominal M_n (AT), φM_n = 0.9·M_n (AU), M_n/Ω (AV), LRFD demand CD, ASD service demand CJ, deflection CB vs allowable BD = (span ft ÷ divisor)×12. Lightest passing W matches SORTBY(FILTER(CF…), weight) — workbook P14 (LRFD) / X14 (ASD).
                        </p>
                      </CardBody>
                    </Card>

                    {excelDesign ? (
                      <Card>
                        <CardHeader
                          title="Design (Bending) — lightest W-shapes"
                          description="First entries match workbook P14 (LRFD) and X14 (ASD). Design mode auto-select uses the track for your design method when loads and span are set."
                        />
                        <CardBody className="space-y-4 text-sm text-slate-800">
                          <div className="grid gap-3 md:grid-cols-2">
                            <div className="rounded-lg border border-slate-200 bg-white p-3">
                              <p className="text-xs font-semibold text-slate-700">LRFD (CF column)</p>
                              <p className="mt-1 tabular-nums text-slate-900">
                                Lightest: {excelDesign.lightestLrfdShape ?? "—"}{" "}
                                {excelDesign.lightestLrfdWeight != null ? `(${excelDesign.lightestLrfdWeight} lb/ft)` : ""}
                              </p>
                            </div>
                            <div className="rounded-lg border border-slate-200 bg-white p-3">
                              <p className="text-xs font-semibold text-slate-700">ASD (CL column)</p>
                              <p className="mt-1 tabular-nums text-slate-900">
                                Lightest: {excelDesign.lightestAsdShape ?? "—"}{" "}
                                {excelDesign.lightestAsdWeight != null ? `(${excelDesign.lightestAsdWeight} lb/ft)` : ""}
                              </p>
                            </div>
                          </div>
                          <div className="overflow-x-auto rounded-lg border border-slate-200">
                            <table className="w-full min-w-[640px] text-left text-xs">
                              <thead className="bg-slate-50 font-semibold text-slate-700">
                                <tr>
                                  <th className="px-2 py-2">W</th>
                                  <th className="px-2 py-2">plf</th>
                                  <th className="px-2 py-2">Flange</th>
                                  <th className="px-2 py-2">φM_n</th>
                                  <th className="px-2 py-2">M_u</th>
                                  <th className="px-2 py-2">CC</th>
                                  <th className="px-2 py-2">CE</th>
                                </tr>
                              </thead>
                              <tbody>
                                {excelDesign.lrfdPassing.map((r) => (
                                  <tr key={r.shapeName} className="border-t border-slate-200 tabular-nums">
                                    <td className="px-2 py-1.5 font-medium">{r.shapeName}</td>
                                    <td className="px-2 py-1.5">{r.weightPlf}</td>
                                    <td className="px-2 py-1.5">{r.flangeClassLabel}</td>
                                    <td className="px-2 py-1.5">{fmtKipFt(r.AU_kipFt)}</td>
                                    <td className="px-2 py-1.5">{fmtKipFt(r.CD_kipFt)}</td>
                                    <td className="px-2 py-1.5">{r.ccDeflection || "—"}</td>
                                    <td className="px-2 py-1.5">{r.CE_value != null ? fmtKipFt(r.CE_value) : "—"}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {excelDesign.lrfdPassing.length === 0 ? (
                              <p className="p-3 text-xs text-slate-600">No W-shape passes LRFD row (CE blank for all).</p>
                            ) : null}
                          </div>
                        </CardBody>
                      </Card>
                    ) : (
                      <Card>
                        <CardHeader title="Design (Bending)" description="Enter dead load, live load, and span (ft) under Loads to run the workbook design grid." />
                        <CardBody className="text-sm text-[color:var(--muted)]">
                          The design sheet uses E13, E14, E15 with the same pattern and deflection divisor as the Analysis tab.
                        </CardBody>
                      </Card>
                    )}
                  </div>
                ),
              },
              {
                id: "strengths",
                label: "Strengths",
                panel: (
                  <Card>
                    <CardHeader title="Design strengths" description="Capacities by limit state." />
                    <CardBody>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {Object.entries(out.results).map(([key, value]) => (
                          <div key={key} className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-2)] px-4 py-3 shadow-sm">
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="text-xs font-semibold text-[color:var(--muted)]">{value.name}</span>
                              <span className="font-semibold tabular-nums text-[color:var(--foreground)]">
                                {value.unit === "kip-ft" ? fmtKipFt(value.phiPn) : fmtKips(value.phiPn)} {value.unit}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardBody>
                  </Card>
                ),
              },
              {
                id: "steps",
                label: "Steps",
                panel: (
                  <Card id="beam-steps">
                    <CardHeader title="Steps" description={`Governing: ${String(out.beamLimitStates?.governing ?? out.governingCase)}`} />
                    <CardBody>
                      <StepsTable
                        steps={out.steps}
                        governingCase={String(out.beamLimitStates?.governing ?? out.governingCase)}
                        tools
                      />
                    </CardBody>
                  </Card>
                ),
              },
            ]}
            className="mt-8"
          />
        ) : null}
      </div>
    </AppShell>
  );
}

function WorkbookRow(props: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap justify-between gap-2 text-xs">
      <span className="text-slate-600">{props.label}</span>
      <span className="font-semibold text-slate-900">{props.value}</span>
    </div>
  );
}

function LimitRow(props: {
  title: string;
  demand: number;
  capacity: number;
  ratio: number;
  unit: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="text-sm font-semibold text-slate-900">{props.title}</p>
      <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2 text-xs text-slate-700">
        <span className="tabular-nums">
          Demand {(props.unit === "kip-ft" ? fmtKipFt(props.demand) : fmtKips(props.demand))} / Capacity{" "}
          {(props.unit === "kip-ft" ? fmtKipFt(props.capacity) : fmtKips(props.capacity))} {props.unit}
        </span>
        <span className="font-semibold tabular-nums text-slate-900">{(props.ratio * 100).toFixed(1)}%</span>
      </div>
      <div className="mt-2">
        <UtilizationBar ratio={props.ratio} />
      </div>
    </div>
  );
}
