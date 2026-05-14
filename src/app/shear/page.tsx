"use client";

import { useEffect, useMemo, useState } from "react";
import {
  asdStrengthUniformLoadKlf,
  lrfdFactoredUniformLoadKlf,
  serviceUniformLoadKlf,
} from "@/lib/excel-parity";
import { fmtKipFt, fmtKips } from "@/lib/format/display";
import { flangeWebSlenderness } from "@/lib/limit-state-engine/section-slenderness";
import { aiscShapes } from "@/lib/aisc/data";
import { normalizeSteelMaterialKey, steelMaterialMap, steelMaterials, type SteelMaterialKey } from "@/lib/data/materials";
import { AppShell } from "@/components/layout/AppShell";
import { ModuleHero } from "@/components/layout/ModuleHero";
import { ResultHero } from "@/components/results/ResultHero";
import { CalculatorActionRail } from "@/components/actions/CalculatorActionRail";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Field, SelectInput, TextInput } from "@/components/ui/Field";
import { StepsTable } from "@/components/StepsTable";
import { useBrowserDraft } from "@/features/module-runtime/useBrowserDraft";
import { CLIENT_PERSISTENCE } from "@/lib/client-persistence";
import { STORAGE } from "@/lib/storage/keys";
import { bendingDefaults } from "@/features/steel/bending/module-config";
import { evaluateShear, shearDefaults, shearDraftSchema } from "@/features/steel/shear/module-config";
import { evaluateBending } from "@/features/steel/bending/module-config";
import { formatRelativeTime } from "@/lib/format/relativeTime";
import { smoothScrollTo } from "@/features/module-runtime/scroll";
import { Badge } from "@/components/ui/Badge";
import { ModuleDetailsTabs } from "@/components/layout/ModuleDetailsTabs";
import { ModeSwitch } from "@/components/ui/ModeSwitch";
import { TextInputWithUnit } from "@/components/ui/InputGroup";
import { UtilizationBar } from "@/components/ui/UtilizationBar";

export default function ShearPage() {
  const [designMethod, setDesignMethod] = useState<"LRFD" | "ASD">(shearDefaults.designMethod);
  const [material, setMaterial] = useState<SteelMaterialKey>(shearDefaults.material as SteelMaterialKey);
  const [shapeName, setShapeName] = useState(shearDefaults.shapeName);
  const [Mu, setMu] = useState(shearDefaults.Mu);
  const [Vu, setVu] = useState(shearDefaults.Vu);
  const [L, setL] = useState(shearDefaults.L);
  const [wLive, setWLive] = useState(shearDefaults.wLive);
  const [deadLoadKft, setDeadLoadKft] = useState(shearDefaults.deadLoadKft);
  const [liveLoadKft, setLiveLoadKft] = useState(shearDefaults.liveLoadKft);
  const [spanFt, setSpanFt] = useState(shearDefaults.spanFt);
  const [unbracedLbIn, setUnbracedLbIn] = useState(shearDefaults.unbracedLbIn);
  const [cbFactor, setCbFactor] = useState(shearDefaults.cbFactor);
  const [stiffening, setStiffening] = useState<"unstiffened" | "stiffened">(shearDefaults.stiffening);
  const [alpha, setAlpha] = useState(shearDefaults.alpha);
  const [mode, setMode] = useState<"check" | "design">(shearDefaults.mode);

  const { savedAt, saving, clearDraft } = useBrowserDraft({
    storageKey: STORAGE.shear,
    savedAtKey: CLIENT_PERSISTENCE.savedAt("shear"),
    schema: shearDraftSchema,
    hydrate: (p) => {
      if (p.designMethod === "LRFD" || p.designMethod === "ASD") setDesignMethod(p.designMethod);
      if (typeof p.material === "string") setMaterial(normalizeSteelMaterialKey(p.material));
      if (typeof p.shapeName === "string") setShapeName(p.shapeName);
      if (typeof p.Vu === "string") setVu(p.Vu);
      else if (typeof p.demandV === "string") setVu(p.demandV);
      if (typeof p.Mu === "string") setMu(p.Mu);
      if (typeof p.L === "string") setL(p.L);
      if (typeof p.wLive === "string") setWLive(p.wLive);
      if (typeof p.deadLoadKft === "string") setDeadLoadKft(p.deadLoadKft);
      if (typeof p.liveLoadKft === "string") setLiveLoadKft(p.liveLoadKft);
      if (typeof p.spanFt === "string") setSpanFt(p.spanFt);
      if (typeof p.unbracedLbIn === "string") setUnbracedLbIn(p.unbracedLbIn);
      if (typeof p.cbFactor === "string") setCbFactor(p.cbFactor);
      if (p.stiffening === "unstiffened" || p.stiffening === "stiffened") setStiffening(p.stiffening);
      if (typeof p.alpha === "string") setAlpha(p.alpha);
      if (p.mode === "check" || p.mode === "design") setMode(p.mode);
    },
    serialize: () => ({
      designMethod,
      material,
      shapeName,
      Mu,
      Vu,
      demandV: Vu,
      L,
      wLive,
      deadLoadKft,
      liveLoadKft,
      spanFt,
      unbracedLbIn,
      cbFactor,
      stiffening,
      alpha,
      mode,
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
      stiffening,
      alpha,
      mode,
    ],
  });

  const shape = aiscShapes.find((s) => s.shape === shapeName);
  const mat = steelMaterialMap[material];

  const slenderness = useMemo(() => {
    if (mode !== "design" || !shape) return null;
    return flangeWebSlenderness(29000, mat.Fy, shape.bf_2tf, shape.h_tw);
  }, [mode, shape, mat]);

  const shapeOptionsW = useMemo(() => aiscShapes.filter((s) => s.type === "W"), []);

  /** W-shapes only for PROGRAM-2 web; if user arrives from Design on HSS, snap to first W. */
  useEffect(() => {
    if (mode !== "check") return;
    queueMicrotask(() => {
      setShapeName((prev) => {
        const cur = aiscShapes.find((s) => s.shape === prev);
        if (cur?.type === "HSS") return aiscShapes.find((s) => s.type === "W")?.shape ?? prev;
        return prev;
      });
    });
  }, [mode]);

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
    const wServiceKipIn = serviceUniformLoadKlf(DL, LL) / 12;
    const Lin = Lft * 12;
    return { wStrengthKlf, MuDer, VuDer, wServiceKipIn, Lin };
  }, [deadLoadKft, liveLoadKft, spanFt, designMethod]);

  useEffect(() => {
    if (mode !== "design") return;
    if (!derivedFromLoads) return;
    queueMicrotask(() => {
      setMu(String(Math.round(derivedFromLoads.MuDer * 1000) / 1000));
      setVu(String(Math.round(derivedFromLoads.VuDer * 1000) / 1000));
      setWLive(String(Math.round(derivedFromLoads.wServiceKipIn * 1000000) / 1000000));
      setL(String(Math.round(derivedFromLoads.Lin)));
    });
  }, [derivedFromLoads, mode]);

  const vuDemand = Number(Vu) || 0;

  const outBeam = useMemo(() => {
    if (mode !== "design" || !shape) return null;
    const Lin = derivedFromLoads?.Lin ?? Number(L);
    const w = derivedFromLoads?.wServiceKipIn ?? Number(wLive);
    const muUse = derivedFromLoads?.MuDer ?? Number(Mu);
    const vuUse = derivedFromLoads?.VuDer ?? Number(Vu);
    const delta = (5 / 384) * w * Lin ** 4 / (29000 * (shape.Ix || 1));
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
      sectionProfile: "W",
    });
  }, [shape, mat, Mu, Vu, L, wLive, designMethod, derivedFromLoads, unbracedLbIn, cbFactor, mode]);

  const outShear = useMemo(() => {
    if (!shape) return null;
    return evaluateShear({
      designMethod,
      Fy: mat.Fy,
      d: shape.d,
      tw: shape.tw,
      hTw: shape.h_tw,
      demandV: vuDemand,
      stiffening,
      alpha: stiffening === "stiffened" ? Number(alpha) || 0 : undefined,
    });
  }, [shape, designMethod, mat, vuDemand, stiffening, alpha]);

  /** Same lightest-W search as Bending-Shear design tab (`bending-shear/page.tsx`). */
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
    const candidates = aiscShapes
      .filter((s) => s.type === "W")
      .map((s) => {
        const delta = (5 / 384) * w * Lin ** 4 / (29000 * (s.Ix || 1));
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
          deflectionAllowable: Lin / 360,
          Lb: LbUse,
          Cb: CbUse,
          sectionProfile: "W",
        });
        return { s, check };
      })
      .filter((c) => c.check.isSafe)
      .sort((a, b) => a.s.W - b.s.W);
    return candidates[0] ?? null;
  }, [mode, Mu, Vu, mat, L, wLive, designMethod, derivedFromLoads, unbracedLbIn, cbFactor]);

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
    setStiffening(shearDefaults.stiffening);
    setAlpha(shearDefaults.alpha);
    setMode(bendingDefaults.mode);
  };

  const invalid = (v: string, min = 0, allowBlank = false) => {
    if (allowBlank && v.trim() === "") return false;
    const n = Number(v);
    return !Number.isFinite(n) || n < min;
  };

  const [designDetailsTab, setDesignDetailsTab] = useState<"steps" | "strengths" | "states">("states");
  const [analysisDetailsTab, setAnalysisDetailsTab] = useState<"steps" | "section">("steps");

  const webRatio =
    outShear && outShear.controllingStrength > 0 ? outShear.demand / outShear.controllingStrength : undefined;

  return (
    <AppShell>
      <div className="space-y-8 md:space-y-10">
        <ModuleHero
          eyebrow="steel module"
          title={
            <>
              Web <span className="text-[color:var(--foreground)]">Shear</span>
            </>
          }
          description={
            mode === "check"
              ? "Workbook source: PROGRAM-2.xlsx / Shear (ANALYSIS). Uses selected W-shape web depth and thickness with method-specific shear capacity."
              : "Member limit states (bending page engine) plus PROGRAM-2 workbook web shear with stiffening. V_u drives both checks. Inputs save in this browser."
          }
          chips={[
            {
              key: "saved",
              label: saving ? "Saving…" : savedAt ? `Saved ${formatRelativeTime(savedAt) ?? "recently"}` : "Not saved yet",
            },
            { key: "mat", label: mat.key },
            { key: "method", label: designMethod },
            { key: "mode", label: mode === "design" ? "Design mode" : "Analysis mode" },
            { key: "shape", label: shapeName },
            { key: "stiff", label: stiffening === "stiffened" ? "Stiffened web" : "Unstiffened web" },
          ]}
          image={{ src: "/assets/shear.png", alt: "Shear module" }}
        />

        <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
          <div className="space-y-6 lg:col-span-7">
            <ModeSwitch
              value={mode}
              onChange={setMode}
              description="Switch any time — your inputs stay saved on this device."
            />

            {mode === "check" ? (
              <Card id="shear-inputs">
                <CardHeader title="Inputs" description="Match the Shear (ANALYSIS) workflow in PROGRAM-2.xlsx." />
                <CardBody className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Method">
                      <SelectInput value={designMethod} onChange={(v) => setDesignMethod(v as "LRFD" | "ASD")}>
                        <option value="LRFD">LRFD</option>
                        <option value="ASD">ASD</option>
                      </SelectInput>
                    </Field>
                    <Field label="Steel type (Fy)" hint="Fy and Fu (ksi) from the material table.">
                      <SelectInput value={material} onChange={(v) => setMaterial(normalizeSteelMaterialKey(String(v)))}>
                        {steelMaterials.map((m) => (
                          <option key={m.key} value={m.key}>
                            {m.label} (Fy={m.Fy}, Fu={m.Fu})
                          </option>
                        ))}
                      </SelectInput>
                    </Field>
                    <Field label="W-shape">
                      <SelectInput value={shapeName} onChange={(v) => setShapeName(String(v))}>
                        {shapeOptionsW.map((s) => (
                          <option key={s.shape} value={s.shape}>
                            {s.shape}
                          </option>
                        ))}
                      </SelectInput>
                    </Field>
                    <Field label="Shear demand V_u (kips)">
                      <TextInput value={Vu} onChange={setVu} />
                    </Field>
                  </div>

                  <div className="grid gap-4 border-t border-[color:var(--border)]/60 pt-4 md:grid-cols-2">
                    <Field
                      label="Web stiffening"
                      hint="Workbook PROGRAM-1 Shear: unstiffened uses k_v = 5; stiffened derives k_v from α/h."
                    >
                      <SelectInput value={stiffening} onChange={(v) => setStiffening(v as "unstiffened" | "stiffened")}>
                        <option value="unstiffened">Unstiffened</option>
                        <option value="stiffened">Stiffened</option>
                      </SelectInput>
                    </Field>
                    {stiffening === "stiffened" ? (
                      <Field label="Stiffener spacing α (in)" hint="Clear distance between transverse stiffeners. Workbook cell E16.">
                        <TextInput value={alpha} onChange={setAlpha} placeholder="e.g. 50" />
                      </Field>
                    ) : null}
                  </div>

                  {shape ? (
                    <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] p-3 text-xs text-[color:var(--muted)]">
                      d = {shape.d.toFixed(3)} in, t_w = {shape.tw.toFixed(3)} in, h/t_w = {shape.h_tw.toFixed(3)}
                    </div>
                  ) : null}
                </CardBody>
              </Card>
            ) : (
              <>
                <Card id="shear-general">
                  <CardHeader
                    title="General"
                    description="Steel, member selection, and method."
                    right={<Badge tone="info">Design mode</Badge>}
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
                      <Field label="Recommended W-shape" hint="Lightest passing W (auto-selected).">
                        <div className="rounded-2xl bg-[color:var(--surface-2)] px-3 py-2 text-sm font-semibold ring-1 ring-inset ring-[color:var(--border)]/60">
                          {suggestion ? suggestion.s.shape : "No passing section found"}
                        </div>
                      </Field>
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
                          <p>
                            λ = {slenderness.flange.lambda.toFixed(2)}, λ_p = {slenderness.flange.lambdaP.toFixed(3)}, λ_r ={" "}
                            {slenderness.flange.lambdaR.toFixed(3)}
                          </p>
                          <p className="text-slate-900">→ {slenderness.flange.class}</p>
                        </div>
                        <div>
                          <p className="font-semibold">{slenderness.web.label}</p>
                          <p>
                            λ = {slenderness.web.lambda.toFixed(2)}, λ_p = {slenderness.web.lambdaP.toFixed(3)}, λ_r ={" "}
                            {slenderness.web.lambdaR.toFixed(3)}
                          </p>
                          <p className="text-slate-900">→ {slenderness.web.class}</p>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ) : null}

                <Card id="shear-loads">
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

                <Card id="shear-member-checks">
                  <CardHeader title="Member checks" description="Enter demands directly (or use Loads above). L is inches for analysis. V_u is also used for PROGRAM-2 web shear (below)." />
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

                <Card id="shear-web-program">
                  <CardHeader
                    title="Web stiffening (PROGRAM-2)"
                    description="Workbook web model: unstiffened k_v = 5; stiffened uses α/h per PROGRAM-1. Demand = V_u from Member checks."
                  />
                  <CardBody className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field
                        label="Web stiffening"
                        hint="Workbook PROGRAM-1 Shear: unstiffened uses k_v = 5; stiffened derives k_v from α/h."
                      >
                        <SelectInput value={stiffening} onChange={(v) => setStiffening(v as "unstiffened" | "stiffened")}>
                          <option value="unstiffened">Unstiffened</option>
                          <option value="stiffened">Stiffened</option>
                        </SelectInput>
                      </Field>
                      {stiffening === "stiffened" ? (
                        <Field label="Stiffener spacing α (in)" hint="Clear distance between transverse stiffeners. Workbook cell E16.">
                          <TextInput value={alpha} onChange={setAlpha} placeholder="e.g. 50" />
                        </Field>
                      ) : null}
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
              </>
            )}
          </div>

          <div className="space-y-4 lg:col-span-5 lg:sticky lg:top-28" id="shear-results">
            {mode === "check" ? (
              <>
                <div id="shear-results-hero">
                  <ResultHero
                    status={!outShear ? "invalid" : outShear.isSafe ? "safe" : "unsafe"}
                    title={`${designMethod} shear status`}
                    governing={outShear?.governingCase ?? "—"}
                    capacityLabel={designMethod === "LRFD" ? "φV_n" : "V_n / Ω"}
                    capacity={outShear ? fmtKips(outShear.controllingStrength) : "—"}
                    demandLabel="V_u demand"
                    demand={outShear ? fmtKips(outShear.demand) : "—"}
                    utilization={webRatio}
                    metaRight={
                      <span className="text-xs font-semibold text-[color:var(--muted)]">
                        {saving ? "Saving..." : savedAt ? `Saved ${formatRelativeTime(savedAt) ?? "recently"}` : "Auto-save ready"}
                      </span>
                    }
                  />
                </div>

                <CalculatorActionRail
                  title="Actions"
                  subtitle={`${shapeName} · ${designMethod}`}
                  savedKey={CLIENT_PERSISTENCE.savedAt("shear")}
                  saving={saving}
                  savedAt={savedAt}
                  saveSlots={{
                    moduleKey: "shear",
                    draftStorageKey: STORAGE.shear,
                    getCurrent: () => ({
                      designMethod,
                      material,
                      shapeName,
                      Mu,
                      Vu,
                      demandV: Vu,
                      L,
                      wLive,
                      deadLoadKft,
                      liveLoadKft,
                      spanFt,
                      unbracedLbIn,
                      cbFactor,
                      stiffening,
                      alpha,
                      mode,
                    }),
                  }}
                  compare={{
                    storageKey: CLIENT_PERSISTENCE.compareSnapshot("shear"),
                    getCurrent: () => ({
                      title: `Shear — ${shapeName}`,
                      lines: [
                        `Method: ${designMethod}`,
                        `Material: ${material}`,
                        `Shape: ${shapeName}`,
                        `Demand V_u: ${Vu || "0"} kips`,
                        outShear ? `Capacity: ${outShear.controllingStrength.toFixed(3)} kips` : "Capacity: —",
                        outShear ? `Status: ${outShear.isSafe ? "SAFE" : "NOT SAFE"}` : "Status: —",
                      ],
                    }),
                  }}
                  copyText={() =>
                    [
                      "Shear module",
                      `Method: ${designMethod}`,
                      `Material: ${material}`,
                      `Shape: ${shapeName}`,
                      `Demand V_u: ${Vu || "0"} kips`,
                      outShear ? `Capacity: ${outShear.controllingStrength.toFixed(3)} kips` : "Capacity: —",
                      outShear ? `Status: ${outShear.isSafe ? "SAFE" : "NOT SAFE"}` : "Status: —",
                    ].join("\n")
                  }
                  onGoResults={() => smoothScrollTo("shear-results-hero")}
                  onGoSteps={() => {
                    setAnalysisDetailsTab("steps");
                    smoothScrollTo("shear-details");
                  }}
                  onReset={resetInputs}
                />
              </>
            ) : (
              <>
                <div id="shear-results-hero">
                  {outBeam ? (
                    <ResultHero
                      status={outBeam.governingCase === "geometry_error" ? "invalid" : outBeam.isSafe ? "safe" : "unsafe"}
                      governing={outBeam.beamLimitStates?.governing ?? outBeam.governingCase}
                      capacityLabel={outBeam.beamLimitStates ? "Max utilization" : "Capacity"}
                      capacity={
                        outBeam.beamLimitStates
                          ? `${(
                              Math.max(
                                outBeam.beamLimitStates.bending.ratio,
                                outBeam.beamLimitStates.shear.ratio,
                                outBeam.beamLimitStates.deflection.ratio,
                              ) * 100
                            ).toFixed(1)}%`
                          : fmtKips(outBeam.controllingStrength)
                      }
                      demandLabel={outBeam.beamLimitStates ? "Demand (overall)" : "Demand"}
                      demand={fmtKips(outBeam.demand)}
                      utilization={
                        outBeam.beamLimitStates
                          ? Math.max(
                              outBeam.beamLimitStates.bending.ratio,
                              outBeam.beamLimitStates.shear.ratio,
                              outBeam.beamLimitStates.deflection.ratio,
                            )
                          : outBeam.controllingStrength > 0
                            ? outBeam.demand / outBeam.controllingStrength
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

                {outShear ? (
                  <Card className="border border-[color:var(--border)] bg-[color:var(--surface-2)]">
                    <CardHeader
                      title="PROGRAM-2 web shear"
                      description={`${designMethod} · ${stiffening === "stiffened" ? `Stiffened (α = ${alpha || "0"} in)` : "Unstiffened"}`}
                    />
                    <CardBody className="space-y-2 text-sm">
                      <p className="tabular-nums text-[color:var(--foreground)]">
                        Demand V_u = {fmtKips(outShear.demand)} · Capacity ({designMethod === "LRFD" ? "φV_n" : "V_n/Ω"}) ={" "}
                        {fmtKips(outShear.controllingStrength)}
                      </p>
                      <p className="font-semibold text-[color:var(--foreground)]">
                        Status: {outShear.isSafe ? "SAFE" : "NOT SAFE"} · Governing: {outShear.governingCase}
                      </p>
                      {webRatio != null && Number.isFinite(webRatio) ? (
                        <div className="pt-1">
                          <UtilizationBar ratio={webRatio} />
                        </div>
                      ) : null}
                    </CardBody>
                  </Card>
                ) : null}

                <CalculatorActionRail
                  title="Actions"
                  subtitle={`${shapeName} · ${designMethod} · Design mode`}
                  savedKey={CLIENT_PERSISTENCE.savedAt("shear")}
                  saving={saving}
                  savedAt={savedAt}
                  saveSlots={{
                    moduleKey: "shear",
                    draftStorageKey: STORAGE.shear,
                    getCurrent: () => ({
                      designMethod,
                      material,
                      shapeName,
                      Mu,
                      Vu,
                      demandV: Vu,
                      L,
                      wLive,
                      deadLoadKft,
                      liveLoadKft,
                      spanFt,
                      unbracedLbIn,
                      cbFactor,
                      stiffening,
                      alpha,
                      mode,
                    }),
                  }}
                  compare={{
                    storageKey: CLIENT_PERSISTENCE.compareSnapshot("shear"),
                    getCurrent: () => {
                      const gov = outBeam?.beamLimitStates?.governing ?? outBeam?.governingCase ?? "—";
                      const lines: string[] = [
                        `Method: ${designMethod} · Material: ${mat.key} · Mode: ${mode}`,
                        `Shape: ${shapeName}`,
                        `Mu: ${Mu} kip-ft · Vu: ${Vu} kips · L: ${L} in`,
                        `Web: ${stiffening}${stiffening === "stiffened" ? ` (α = ${alpha || "0"} in)` : ""}`,
                        `Governing (member): ${String(gov)}`,
                      ];
                      if (outBeam?.beamLimitStates) {
                        lines.push(
                          `Bending ratio: ${(outBeam.beamLimitStates.bending.ratio * 100).toFixed(1)}%`,
                          `Shear ratio: ${(outBeam.beamLimitStates.shear.ratio * 100).toFixed(1)}%`,
                          `Deflection ratio: ${(outBeam.beamLimitStates.deflection.ratio * 100).toFixed(1)}%`,
                        );
                      } else if (outBeam) {
                        lines.push(`Member capacity: ${fmtKips(outBeam.controllingStrength)} · Demand: ${fmtKips(outBeam.demand)}`);
                      }
                      if (outShear) {
                        lines.push(
                          `PROGRAM-2 web: ${outShear.isSafe ? "SAFE" : "NOT SAFE"} · φVn/Vn/Ω = ${outShear.controllingStrength.toFixed(3)} kips`,
                        );
                      }
                      return { title: `Shear — ${shapeName}`, lines };
                    },
                  }}
                  copyText={() => {
                    if (!outBeam) return "Shear — No results";
                    const lines = [
                      "Shear module (member + PROGRAM-2 web)",
                      `Method: ${designMethod}`,
                      `Material: ${mat.key}`,
                      `Shape: ${shapeName}`,
                      `Governing: ${outBeam.beamLimitStates?.governing ?? outBeam.governingCase}`,
                      `Demand: ${fmtKips(outBeam.demand)}`,
                    ];
                    if (outBeam.beamLimitStates) {
                      lines.push(
                        `Bending ratio: ${(outBeam.beamLimitStates.bending.ratio * 100).toFixed(1)}%`,
                        `Shear ratio: ${(outBeam.beamLimitStates.shear.ratio * 100).toFixed(1)}%`,
                        `Deflection ratio: ${(outBeam.beamLimitStates.deflection.ratio * 100).toFixed(1)}%`,
                      );
                    } else {
                      lines.push(`Capacity: ${fmtKips(outBeam.controllingStrength)}`);
                    }
                    if (outShear) {
                      lines.push(
                        `PROGRAM-2 web: V_u = ${fmtKips(outShear.demand)}, capacity = ${fmtKips(outShear.controllingStrength)}, ${outShear.isSafe ? "SAFE" : "NOT SAFE"}`,
                      );
                    }
                    return lines.join("\n");
                  }}
                  onGoResults={() => smoothScrollTo("shear-results-hero")}
                  onGoSteps={() => {
                    setDesignDetailsTab("steps");
                    smoothScrollTo("shear-details");
                  }}
                  onReset={resetInputs}
                />
              </>
            )}
          </div>
        </div>

        {mode === "check" ? (
          <ModuleDetailsTabs
            title="Details"
            description="Review step-by-step computations and selected section properties."
            value={analysisDetailsTab}
            onChange={(v) => setAnalysisDetailsTab(v as "steps" | "section")}
            tabs={[
              {
                id: "steps",
                label: "Steps",
                panel: (
                  <Card id="shear-details">
                    <CardHeader title="Computation steps" />
                    <CardBody>{outShear ? <StepsTable steps={outShear.steps} /> : <p className="text-sm text-[color:var(--muted)]">Select a shape.</p>}</CardBody>
                  </Card>
                ),
              },
              {
                id: "section",
                label: "Section",
                panel: (
                  <Card>
                    <CardHeader title="Section properties" />
                    <CardBody className="space-y-2 text-sm text-[color:var(--foreground)]">
                      {shape ? (
                        <>
                          <p>
                            <span className="font-semibold">Shape:</span> {shape.shape} <Badge tone="info">W</Badge>
                          </p>
                          <p>
                            <span className="font-semibold">Depth d:</span> {shape.d.toFixed(3)} in
                          </p>
                          <p>
                            <span className="font-semibold">Web thickness t_w:</span> {shape.tw.toFixed(3)} in
                          </p>
                          <p>
                            <span className="font-semibold">h/t_w:</span> {shape.h_tw.toFixed(3)}
                          </p>
                          <p>
                            <span className="font-semibold">Material Fy:</span> {mat.Fy.toFixed(1)} ksi
                          </p>
                        </>
                      ) : (
                        <p className="text-[color:var(--muted)]">Select a shape.</p>
                      )}
                    </CardBody>
                  </Card>
                ),
              },
            ]}
            className="mt-8"
          />
        ) : outBeam ? (
          <ModuleDetailsTabs
            title="Details"
            description="Limit states, design strengths, and computation steps (member engine + PROGRAM-2 web steps)."
            value={designDetailsTab}
            onChange={(v) => setDesignDetailsTab(v as "steps" | "strengths" | "states")}
            tabs={[
              {
                id: "states",
                label: "Limit states",
                panel: outBeam.beamLimitStates ? (
                  <Card>
                    <CardHeader title="Limit states (utilization)" description="Demand/capacity ratios by check." />
                    <CardBody className="space-y-3">
                      <LimitRow
                        title="Bending"
                        demand={outBeam.beamLimitStates.bending.demand}
                        capacity={outBeam.beamLimitStates.bending.capacity}
                        ratio={outBeam.beamLimitStates.bending.ratio}
                        unit={outBeam.beamLimitStates.bending.unit}
                      />
                      <LimitRow
                        title={`Shear (${outBeam.beamLimitStates.shear.cvCase}, C_v = ${outBeam.beamLimitStates.shear.cv.toFixed(4)})`}
                        demand={outBeam.beamLimitStates.shear.demand}
                        capacity={outBeam.beamLimitStates.shear.capacity}
                        ratio={outBeam.beamLimitStates.shear.ratio}
                        unit={outBeam.beamLimitStates.shear.unit}
                      />
                      <LimitRow
                        title={
                          deadLoadKft.trim() && liveLoadKft.trim() && spanFt.trim()
                            ? "Deflection (service D+L)"
                            : "Deflection (service w)"
                        }
                        demand={outBeam.beamLimitStates.deflection.demand}
                        capacity={outBeam.beamLimitStates.deflection.capacity}
                        ratio={outBeam.beamLimitStates.deflection.ratio}
                        unit={outBeam.beamLimitStates.deflection.unit}
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
                id: "strengths",
                label: "Strengths",
                panel: (
                  <Card>
                    <CardHeader title="Design strengths" description="Capacities by limit state." />
                    <CardBody>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {Object.entries(outBeam.results).map(([key, value]) => (
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
                  <div className="space-y-6">
                    <Card id="shear-details">
                      <CardHeader title="Member engine steps" description={`Governing: ${String(outBeam.beamLimitStates?.governing ?? outBeam.governingCase)}`} />
                      <CardBody>
                        <StepsTable
                          steps={outBeam.steps}
                          governingCase={String(outBeam.beamLimitStates?.governing ?? outBeam.governingCase)}
                          tools
                        />
                      </CardBody>
                    </Card>
                    {outShear ? (
                      <Card>
                        <CardHeader title="PROGRAM-2 web shear steps" description="Workbook stiffening model (same V_u as Member checks)." />
                        <CardBody>
                          <StepsTable steps={outShear.steps} />
                        </CardBody>
                      </Card>
                    ) : null}
                  </div>
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
