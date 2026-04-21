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
import { steelMaterialMap, steelMaterials, type SteelMaterialKey } from "@/lib/data/materials";
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
import { bendingDefaults, bendingDraftSchema, evaluateBending } from "@/features/steel/bending/module-config";
import { ModuleHero } from "@/components/layout/ModuleHero";
import { ModuleDetailsTabs } from "@/components/layout/ModuleDetailsTabs";
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
  const { saving, savedAt, clearDraft } = useBrowserDraft({
    storageKey: STORAGE.bending,
    savedAtKey: CLIENT_PERSISTENCE.savedAt("bending"),
    schema: bendingDraftSchema,
    hydrate: (p) => {
      if (p.designMethod === "LRFD" || p.designMethod === "ASD") setDesignMethod(p.designMethod);
      if (typeof p.material === "string") setMaterial(p.material as SteelMaterialKey);
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
    }),
    watch: [designMethod, material, shapeName, Mu, Vu, L, wLive, deadLoadKft, liveLoadKft, spanFt, unbracedLbIn, cbFactor, mode],
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

  useEffect(() => {
    if (!derivedFromLoads) return;
    queueMicrotask(() => {
      setMu(String(Math.round(derivedFromLoads.MuDer * 1000) / 1000));
      setVu(String(Math.round(derivedFromLoads.VuDer * 1000) / 1000));
      setWLive(String(Math.round(derivedFromLoads.wServiceKipIn * 1000000) / 1000000));
      setL(String(Math.round(derivedFromLoads.Lin)));
    });
  }, [derivedFromLoads]);

  const out = useMemo(() => {
    if (!shape) return null;
    const Lin = derivedFromLoads?.Lin ?? Number(L);
    const w = derivedFromLoads?.wServiceKipIn ?? Number(wLive);
    const muUse = derivedFromLoads?.MuDer ?? Number(Mu);
    const vuUse = derivedFromLoads?.VuDer ?? Number(Vu);
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
  };

  const invalid = (v: string, min = 0, allowBlank = false) => {
    if (allowBlank && v.trim() === "") return false;
    const n = Number(v);
    return !Number.isFinite(n) || n < min;
  };

  const [detailsTab, setDetailsTab] = useState<"steps" | "strengths" | "states">("states");

  return (
    <AppShell>
      <div className="space-y-8 md:space-y-10">
        <ModuleHero
          eyebrow="steel module"
          title={
            <>
              Bending{" "}
              <span className="text-[color:var(--foreground)]">, Shear &amp; Deflection</span>
            </>
          }
          description="Simply supported strong axis: rolled W-shapes (full F6/F2) or rectangular HSS (approximate limits in-engine). Design mode suggests lightest W only. Inputs save in this browser."
          chips={[
            { key: "saved", label: saving ? "Saving…" : savedAt ? `Saved ${formatRelativeTime(savedAt) ?? "recently"}` : "Not saved yet" },
            { key: "mat", label: steelMaterialMap[material].key },
            { key: "method", label: designMethod },
            { key: "mode", label: mode === "design" ? "Design" : "Check" },
          ]}
          image={{ src: "/assets/bending.png" }}
        />

        <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
          <div className="space-y-6 lg:col-span-7">
            <Card id="beam-general">
              <CardHeader title="General" description="Steel, member selection, check/design mode, and method." right={<Badge tone="info">Inputs</Badge>} />
              <CardBody>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Steel Type" hint="Fy and Fu (ksi) from the material table.">
                    <SelectInput value={material} onChange={(v) => setMaterial(v as SteelMaterialKey)}>
                      {steelMaterials.map((m) => (
                        <option key={m.key} value={m.key}>
                          {m.label} (Fy = {m.Fy} ksi)
                        </option>
                      ))}
                    </SelectInput>
                  </Field>
                  <Field
                    label={mode === "design" ? "W-shape (design)" : "Member (W or HSS)"}
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
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <Field label="Mode" hint="Check a chosen section, or suggest a lighter W that works.">
                    <SelectInput value={mode} onChange={(v) => setMode(v as "check" | "design")}>
                      <option value="check">Check section</option>
                      <option value="design">Suggest lightest W</option>
                    </SelectInput>
                  </Field>
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
                      <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--muted)]">Section context</p>
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
                        {designMethod === "LRFD" ? " (LRFD factored)" : " (ASD D + L)"}
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
              subtitle={`${shapeName} · ${designMethod} · ${mode === "design" ? "Design" : "Check"}`}
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
                  return { title: `Beam — ${shapeName}`, lines };
                },
              }}
              copyText={() => {
                if (!out) return "Beam — No results";
                const lines = [
                  "Beam",
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
              json={
                out
                  ? {
                      data: {
                        result: out,
                        inputs: { material, shapeName, Mu, Vu, L, wLive, designMethod, unbracedLbIn, cbFactor },
                      },
                    }
                  : undefined
              }
              onReset={resetInputs}
            />
          </div>
        </div>

        {out ? (
          <ModuleDetailsTabs
            title="Details"
            description="Steps, limit states, and design strengths."
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
