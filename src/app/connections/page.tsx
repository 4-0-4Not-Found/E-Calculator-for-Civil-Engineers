"use client";

import { useMemo, useState } from "react";
import {
  calculateBoltShearBearingCombinedLRFD,
  calculateBoltShearTensionInteractionLRFD,
  calculateBoltSlipCritical,
  calculateBoltTensionLRFD,
  calculateFilletWeldLRFD,
  filletWeldMinLegInForDemand,
  lrfdToAsdSamePhiOmega,
} from "@/lib/limit-state-engine/connections";
import {
  approximateMinPlateThicknessForPryingLRFD,
  calculateGrooveWeldShearLRFD,
} from "@/lib/limit-state-engine/connections-advanced";
import { boltDiametersIn, type BoltGroup, type BoltThreadMode } from "@/lib/data/bolts";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Field, SelectInput, TextInput } from "@/components/ui/Field";
import { CLIENT_PERSISTENCE } from "@/lib/client-persistence";
import { STORAGE } from "@/lib/storage/keys";
import { AppShell } from "@/components/layout/AppShell";
import { ResultHero } from "@/components/results/ResultHero";
import { TextInputWithUnit } from "@/components/ui/InputGroup";
import { Button } from "@/components/ui/Button";
import { CalculatorActionRail } from "@/components/actions/CalculatorActionRail";
import { useBrowserDraft } from "@/features/module-runtime/useBrowserDraft";
import { smoothScrollTo } from "@/features/module-runtime/scroll";
import { connectionsDefaults, connectionsDraftSchema } from "@/features/steel/connections/module-config";
import { ModuleHero } from "@/components/layout/ModuleHero";
import { ModuleDetailsTabs } from "@/components/layout/ModuleDetailsTabs";
import { formatRelativeTime } from "@/lib/format/relativeTime";

export default function ConnectionsPage() {
  const [designMethod, setDesignMethod] = useState<"LRFD" | "ASD">(connectionsDefaults.designMethod);
  const [shearMode, setShearMode] = useState<"bearing" | "slip">(connectionsDefaults.shearMode);
  const [surfaceClass, setSurfaceClass] = useState<"A" | "B">(connectionsDefaults.surfaceClass);
  const [slipHf, setSlipHf] = useState(connectionsDefaults.slipHf);
  const [vu, setVu] = useState(connectionsDefaults.vu);
  const [tu, setTu] = useState(connectionsDefaults.tu);
  const [boltGroup, setBoltGroup] = useState<BoltGroup>(connectionsDefaults.boltGroup as BoltGroup);
  const [dBolt, setDBolt] = useState(connectionsDefaults.dBolt);
  const [nBolts, setNBolts] = useState(connectionsDefaults.nBolts);
  const [shearPlanes, setShearPlanes] = useState<"1" | "2">(connectionsDefaults.shearPlanes);
  const [threadMode, setThreadMode] = useState<BoltThreadMode>(connectionsDefaults.threadMode as BoltThreadMode);

  const [checkBearing, setCheckBearing] = useState(connectionsDefaults.checkBearing);
  const [plateFu, setPlateFu] = useState(connectionsDefaults.plateFu);
  const [plateT, setPlateT] = useState(connectionsDefaults.plateT);
  const [lcMin, setLcMin] = useState(connectionsDefaults.lcMin);

  const [fexx, setFexx] = useState(connectionsDefaults.fexx);
  const [legIn, setLegIn] = useState(connectionsDefaults.legIn);
  const [weldLen, setWeldLen] = useState(connectionsDefaults.weldLen);
  const [weldDemand, setWeldDemand] = useState(connectionsDefaults.weldDemand);

  /** Groove/CJP weld metal in shear on user-entered effective throat × length. */
  const [grooveThroatIn, setGrooveThroatIn] = useState(connectionsDefaults.grooveThroatIn);
  const [grooveLenIn, setGrooveLenIn] = useState(connectionsDefaults.grooveLenIn);
  const [grooveDemand, setGrooveDemand] = useState(connectionsDefaults.grooveDemand);
  /** Blank → use T_u / n when T_u &gt; 0. */
  const [pryingTPerBoltOverride, setPryingTPerBoltOverride] = useState(connectionsDefaults.pryingTPerBoltOverride);
  const [pryingBPrimeIn, setPryingBPrimeIn] = useState(connectionsDefaults.pryingBPrimeIn);
  const [pryingStripWidthIn, setPryingStripWidthIn] = useState(connectionsDefaults.pryingStripWidthIn);
  const [pryingFyKsi, setPryingFyKsi] = useState(connectionsDefaults.pryingFyKsi);
  const { saving, savedAt, clearDraft } = useBrowserDraft({
    storageKey: STORAGE.connections,
    savedAtKey: CLIENT_PERSISTENCE.savedAt("connections"),
    schema: connectionsDraftSchema,
    hydrate: (p) => {
      if (typeof p.designMethod === "string") setDesignMethod(p.designMethod as "LRFD" | "ASD");
      if (typeof p.shearMode === "string") setShearMode(p.shearMode as "bearing" | "slip");
      if (typeof p.surfaceClass === "string") setSurfaceClass(p.surfaceClass as "A" | "B");
      if (typeof p.slipHf === "string") setSlipHf(p.slipHf);
      if (typeof p.vu === "string") setVu(p.vu);
      if (typeof p.tu === "string") setTu(p.tu);
      if (typeof p.boltGroup === "string") setBoltGroup(p.boltGroup as BoltGroup);
      if (typeof p.dBolt === "string") setDBolt(p.dBolt);
      if (typeof p.nBolts === "string") setNBolts(p.nBolts);
      if (typeof p.shearPlanes === "string") setShearPlanes(p.shearPlanes as "1" | "2");
      if (typeof p.threadMode === "string") setThreadMode(p.threadMode as BoltThreadMode);
      if (typeof p.checkBearing === "boolean") setCheckBearing(p.checkBearing);
      if (typeof p.plateFu === "string") setPlateFu(p.plateFu);
      if (typeof p.plateT === "string") setPlateT(p.plateT);
      if (typeof p.lcMin === "string") setLcMin(p.lcMin);
      if (typeof p.fexx === "string") setFexx(p.fexx);
      if (typeof p.legIn === "string") setLegIn(p.legIn);
      if (typeof p.weldLen === "string") setWeldLen(p.weldLen);
      if (typeof p.weldDemand === "string") setWeldDemand(p.weldDemand);
      if (typeof p.grooveThroatIn === "string") setGrooveThroatIn(p.grooveThroatIn);
      if (typeof p.grooveLenIn === "string") setGrooveLenIn(p.grooveLenIn);
      if (typeof p.grooveDemand === "string") setGrooveDemand(p.grooveDemand);
      if (typeof p.pryingTPerBoltOverride === "string") setPryingTPerBoltOverride(p.pryingTPerBoltOverride);
      if (typeof p.pryingBPrimeIn === "string") setPryingBPrimeIn(p.pryingBPrimeIn);
      if (typeof p.pryingStripWidthIn === "string") setPryingStripWidthIn(p.pryingStripWidthIn);
      if (typeof p.pryingFyKsi === "string") setPryingFyKsi(p.pryingFyKsi);
    },
    serialize: () => ({
      designMethod,
      shearMode,
      surfaceClass,
      slipHf,
      vu,
      tu,
      boltGroup,
      dBolt,
      nBolts,
      shearPlanes,
      threadMode,
      checkBearing,
      plateFu,
      plateT,
      lcMin,
      fexx,
      legIn,
      weldLen,
      weldDemand,
      grooveThroatIn,
      grooveLenIn,
      grooveDemand,
      pryingTPerBoltOverride,
      pryingBPrimeIn,
      pryingStripWidthIn,
      pryingFyKsi,
    }),
    watch: [
      designMethod,
      shearMode,
      surfaceClass,
      slipHf,
      vu,
      tu,
      boltGroup,
      dBolt,
      nBolts,
      shearPlanes,
      threadMode,
      checkBearing,
      plateFu,
      plateT,
      lcMin,
      fexx,
      legIn,
      weldLen,
      weldDemand,
      grooveThroatIn,
      grooveLenIn,
      grooveDemand,
      pryingTPerBoltOverride,
      pryingBPrimeIn,
      pryingStripWidthIn,
      pryingFyKsi,
    ],
  });

  const boltOut = useMemo(() => {
    if (shearMode !== "bearing") return null;
    const demandVu = Number(vu);
    const n = Number(nBolts);
    const d = Number(dBolt);
    const t = Number(plateT);
    const lc = Number(lcMin);
    const fu = Number(plateFu);
    if (!Number.isFinite(demandVu) || !Number.isFinite(n) || !Number.isFinite(d) || n < 1 || d <= 0) return null;
    return calculateBoltShearBearingCombinedLRFD({
      demandVu,
      boltGroup,
      threadMode,
      dBolt: d,
      nBolts: Math.floor(n),
      shearPlanes: shearPlanes === "2" ? 2 : 1,
      includeBearing: checkBearing,
      lcMinIn: lc,
      plateThicknessIn: t,
      plateFuKsi: fu,
    });
  }, [shearMode, vu, boltGroup, threadMode, dBolt, nBolts, shearPlanes, checkBearing, plateT, lcMin, plateFu]);

  const slipOut = useMemo(() => {
    if (shearMode !== "slip") return null;
    const demandVu = Number(vu);
    const n = Number(nBolts);
    const d = Number(dBolt);
    const hf = Number(slipHf);
    if (!Number.isFinite(demandVu) || !Number.isFinite(n) || !Number.isFinite(d) || n < 1 || d <= 0) return null;
    if (!Number.isFinite(hf) || hf <= 0) return null;
    return calculateBoltSlipCritical({
      demandVu,
      boltGroup,
      dBolt: d,
      nBolts: Math.floor(n),
      slipPlanes: shearPlanes === "2" ? 2 : 1,
      surfaceClass,
      hf,
      designMethod,
    });
  }, [shearMode, vu, boltGroup, dBolt, nBolts, shearPlanes, surfaceClass, slipHf, designMethod]);

  const tensionOut = useMemo(() => {
    const demandTu = Number(tu);
    const n = Number(nBolts);
    const d = Number(dBolt);
    if (!Number.isFinite(demandTu) || demandTu < 0 || !Number.isFinite(n) || !Number.isFinite(d) || n < 1 || d <= 0) return null;
    return calculateBoltTensionLRFD({
      demandTu,
      boltGroup,
      threadMode,
      dBolt: d,
      nBolts: Math.floor(n),
    });
  }, [tu, boltGroup, threadMode, dBolt, nBolts]);

  const interactionOut = useMemo(() => {
    if (!tensionOut) return null;
    const demandVu = Number(vu);
    const demandTu = Number(tu);
    if (!Number.isFinite(demandVu) || !Number.isFinite(demandTu)) return null;
    let capShear = 0;
    if (shearMode === "slip") {
      if (!slipOut) return null;
      capShear = slipOut.availableSlip;
    } else {
      if (!boltOut) return null;
      capShear =
        designMethod === "LRFD"
          ? boltOut.phiRnTotalGoverning
          : lrfdToAsdSamePhiOmega(boltOut.phiRnTotalGoverning);
    }
    const capTension =
      designMethod === "LRFD" ? tensionOut.phiRnTotal : lrfdToAsdSamePhiOmega(tensionOut.phiRnTotal);
    return calculateBoltShearTensionInteractionLRFD({
      demandVu,
      demandTu,
      phiRnShearTotal: capShear,
      phiRnTensionTotal: capTension,
    });
  }, [shearMode, slipOut, boltOut, tensionOut, vu, tu, designMethod]);

  const weldOut = useMemo(() => {
    const f = Number(fexx);
    const a = Number(legIn);
    const L = Number(weldLen);
    const P = Number(weldDemand);
    if (!Number.isFinite(f) || !Number.isFinite(a) || !Number.isFinite(L) || !Number.isFinite(P) || f <= 0 || a <= 0 || L <= 0) return null;
    return calculateFilletWeldLRFD({ fexx: f, legIn: a, lengthIn: L, demand: P });
  }, [fexx, legIn, weldLen, weldDemand]);

  const weldDemandOk = useMemo(() => {
    if (!weldOut) return null;
    const P = Number(weldDemand);
    if (!Number.isFinite(P)) return null;
    const cap = designMethod === "LRFD" ? weldOut.phiRn : lrfdToAsdSamePhiOmega(weldOut.phiRn, 0.75, 2);
    return P <= cap;
  }, [weldOut, weldDemand, designMethod]);

  const weldMinLegIn = useMemo(() => {
    const P = Number(weldDemand);
    const L = Number(weldLen);
    const f = Number(fexx);
    if (!Number.isFinite(P) || !Number.isFinite(L) || !Number.isFinite(f) || L <= 0 || P <= 0) return null;
    return filletWeldMinLegInForDemand(P, f, L);
  }, [weldDemand, weldLen, fexx]);

  /** T per bolt for prying helper: optional override, else T_u / n when T_u &gt; 0. */
  const pryingTPerBoltKips = useMemo(() => {
    const o = pryingTPerBoltOverride.trim();
    if (o !== "") {
      const v = Number(o);
      if (Number.isFinite(v) && v > 0) return v;
      return null;
    }
    const Tu = Number(tu);
    const n = Math.floor(Number(nBolts));
    if (Number.isFinite(Tu) && Tu > 0 && Number.isFinite(n) && n >= 1) return Tu / n;
    return null;
  }, [pryingTPerBoltOverride, tu, nBolts]);

  const grooveOut = useMemo(() => {
    const f = Number(fexx);
    const t = Number(grooveThroatIn);
    const L = Number(grooveLenIn);
    const P = Number(grooveDemand);
    if (!Number.isFinite(f) || !Number.isFinite(t) || !Number.isFinite(L) || !Number.isFinite(P) || f <= 0 || t <= 0 || L <= 0)
      return null;
    return calculateGrooveWeldShearLRFD({
      fexx: f,
      effectiveThroatIn: t,
      lengthIn: L,
      demandKips: P,
      designMethod,
    });
  }, [fexx, grooveThroatIn, grooveLenIn, grooveDemand, designMethod]);

  const pryingOut = useMemo(() => {
    if (pryingTPerBoltKips == null) return null;
    const b = Number(pryingBPrimeIn);
    const w = Number(pryingStripWidthIn);
    const fy = Number(pryingFyKsi);
    if (!Number.isFinite(b) || !Number.isFinite(w) || !Number.isFinite(fy) || b <= 0 || w <= 0 || fy <= 0) return null;
    return approximateMinPlateThicknessForPryingLRFD({
      boltTensionDemandKips: pryingTPerBoltKips,
      bPrimeIn: b,
      stripWidthIn: w,
      fyKsi: fy,
    });
  }, [pryingTPerBoltKips, pryingBPrimeIn, pryingStripWidthIn, pryingFyKsi]);

  /** Design: min bolts for T_u alone (same d, group); compare to shear/slip suggestions below. */
  const tensionNBoltsSuggested = useMemo(() => {
    if (!tensionOut) return null;
    const Tu = Number(tu);
    if (!Number.isFinite(Tu) || Tu <= 0) return null;
    const nInt = Math.max(1, Math.floor(Number(nBolts)));
    const capTotal =
      designMethod === "LRFD" ? tensionOut.phiRnTotal : lrfdToAsdSamePhiOmega(tensionOut.phiRnTotal);
    const perBolt = capTotal / nInt;
    if (perBolt <= 0) return null;
    return Math.max(1, Math.ceil(Tu / perBolt));
  }, [tensionOut, tu, nBolts, designMethod]);

  /** Upper bound on bolt count when one row shares shear + tension (does not replace interaction check). */
  const unifiedNBoltsSuggested = useMemo(() => {
    const parts: number[] = [];
    if (shearMode === "slip" && slipOut) parts.push(slipOut.nBoltsRequired);
    if (shearMode === "bearing" && boltOut) parts.push(boltOut.nBoltsRequiredGoverning);
    if (tensionNBoltsSuggested != null) parts.push(tensionNBoltsSuggested);
    if (parts.length === 0) return null;
    return Math.max(...parts);
  }, [shearMode, slipOut, boltOut, tensionNBoltsSuggested]);

  const shearAdequate = useMemo(() => {
    if (shearMode === "slip") {
      if (!slipOut) return null;
      return slipOut.isSafe;
    }
    if (!boltOut) return null;
    const cap =
      designMethod === "LRFD"
        ? boltOut.phiRnTotalGoverning
        : lrfdToAsdSamePhiOmega(boltOut.phiRnTotalGoverning);
    return Number(vu) <= cap;
  }, [shearMode, slipOut, boltOut, designMethod, vu]);

  const tensionAdequate = useMemo(() => {
    if (!tensionOut) return null;
    const cap =
      designMethod === "LRFD" ? tensionOut.phiRnTotal : lrfdToAsdSamePhiOmega(tensionOut.phiRnTotal);
    return Number(tu) <= cap;
  }, [tensionOut, designMethod, tu]);

  const overallStatus = useMemo(() => {
    const checks: Array<boolean | null> = [];
    if (shearAdequate !== null) checks.push(shearAdequate);
    if (Number(tu) > 0) {
      if (tensionAdequate !== null) checks.push(tensionAdequate);
      if (interactionOut) checks.push(interactionOut.isSafe);
    }
    if (weldDemandOk !== null) checks.push(weldDemandOk);
    if (grooveOut) checks.push(grooveOut.isSafe);
    if (checks.length === 0) return "invalid" as const;
    return checks.every((c) => c === true) ? ("safe" as const) : ("unsafe" as const);
  }, [shearAdequate, tu, tensionAdequate, interactionOut, weldDemandOk, grooveOut]);

  const resetInputs = () => {
    clearDraft();
    setDesignMethod(connectionsDefaults.designMethod);
    setShearMode(connectionsDefaults.shearMode);
    setSurfaceClass(connectionsDefaults.surfaceClass);
    setSlipHf(connectionsDefaults.slipHf);
    setVu(connectionsDefaults.vu);
    setTu(connectionsDefaults.tu);
    setBoltGroup(connectionsDefaults.boltGroup as BoltGroup);
    setDBolt(connectionsDefaults.dBolt);
    setNBolts(connectionsDefaults.nBolts);
    setShearPlanes(connectionsDefaults.shearPlanes);
    setThreadMode(connectionsDefaults.threadMode as BoltThreadMode);
    setCheckBearing(connectionsDefaults.checkBearing);
    setPlateFu(connectionsDefaults.plateFu);
    setPlateT(connectionsDefaults.plateT);
    setLcMin(connectionsDefaults.lcMin);
    setFexx(connectionsDefaults.fexx);
    setLegIn(connectionsDefaults.legIn);
    setWeldLen(connectionsDefaults.weldLen);
    setWeldDemand(connectionsDefaults.weldDemand);
    setGrooveThroatIn(connectionsDefaults.grooveThroatIn);
    setGrooveLenIn(connectionsDefaults.grooveLenIn);
    setGrooveDemand(connectionsDefaults.grooveDemand);
    setPryingTPerBoltOverride(connectionsDefaults.pryingTPerBoltOverride);
    setPryingBPrimeIn(connectionsDefaults.pryingBPrimeIn);
    setPryingStripWidthIn(connectionsDefaults.pryingStripWidthIn);
    setPryingFyKsi(connectionsDefaults.pryingFyKsi);
  };

  const invalid = (v: string, min = 0) => {
    const n = Number(v);
    return !Number.isFinite(n) || n < min;
  };

  

  const [detailsTab, setDetailsTab] = useState<"bolts" | "weld" | "optional">("bolts");

  return (
    <AppShell>
      <div className="space-y-8 md:space-y-10">
        <ModuleHero
          eyebrow="steel module"
          title={
            <>
              Bolted{" "}
              <span className="text-[color:var(--foreground)]">&amp; Welded Connections</span>
            </>
          }
          description="LRFD or ASD — bolts, welds, and optional groove/prying helpers. Inputs auto-save in this browser."
          chips={[
            { key: "saved", label: saving ? "Saving…" : savedAt ? `Saved ${formatRelativeTime(savedAt) ?? "recently"}` : "Not saved yet" },
            { key: "method", label: designMethod },
            { key: "mode", label: shearMode === "slip" ? "Slip-critical" : "Bearing-type" },
            { key: "bolt", label: `${boltGroup} d=${dBolt} in` },
          ]}
          image={{ src: "/assets/connections.png" }}
        />

        <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
          <div className="space-y-6 lg:col-span-7">
            <Card id="conn-inputs">
              <CardHeader title="Inputs" description="Demands, bolt group, slip/bearing, and optional plate parameters." right={<Badge tone="info">Inputs</Badge>} />
              <CardBody className="space-y-6">
                <div className="mb-1 flex flex-wrap gap-2">
                  <Button variant="secondary" size="sm" type="button" onClick={() => setTu("0")}>
                    Set Tu = 0 (shear-only)
                  </Button>
                  <Button variant="secondary" size="sm" type="button" onClick={() => setDesignMethod("LRFD")}>
                    LRFD
                  </Button>
                  <Button variant="secondary" size="sm" type="button" onClick={() => setDesignMethod("ASD")}>
                    ASD
                  </Button>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Shear transfer" hint="Slip-critical uses Table J3.1 T_b; use A325/A490.">
                    <SelectInput value={shearMode} onChange={(v) => setShearMode(v as "bearing" | "slip")}>
                      <option value="bearing">Bearing-type (shear + optional bearing)</option>
                      <option value="slip">Slip-critical (J3.8)</option>
                    </SelectInput>
                  </Field>
                  <Field label="Design method" hint="LRFD default; ASD uses R_n/Ω for checks.">
                    <SelectInput value={designMethod} onChange={(v) => setDesignMethod(v as "LRFD" | "ASD")}>
                      <option value="LRFD">LRFD</option>
                      <option value="ASD">ASD</option>
                    </SelectInput>
                  </Field>
                  <Field label="Required shear V_u" hint="kips — on bolt group" error={invalid(vu, 0) ? "Enter a number ≥ 0." : undefined}>
                    <TextInputWithUnit value={vu} onChange={setVu} unit="kips" placeholder="e.g. 120" inputMode="decimal" />
                  </Field>
                  <Field label="Required tension T_u" hint="kips — on bolt group (0 if shear-only)" error={invalid(tu, 0) ? "Enter a number ≥ 0." : undefined}>
                    <TextInputWithUnit value={tu} onChange={setTu} unit="kips" placeholder="0" inputMode="decimal" />
                  </Field>
                  <Field label="Bolt ASTM type" hint={shearMode === "slip" ? "Slip-critical: A325 or A490 (T_b from Table J3.1)." : "Table J3.2"}>
                    <SelectInput value={boltGroup} onChange={(v) => setBoltGroup(v as BoltGroup)}>
                      <option value="A307">A307</option>
                      <option value="A325">A325</option>
                      <option value="A490">A490</option>
                    </SelectInput>
                  </Field>
                  {shearMode === "slip" ? (
                    <>
                      <Field label="Surface class (μ)" hint="Class A = 0.30, Class B = 0.50 (clean mill scale / blasted).">
                        <SelectInput value={surfaceClass} onChange={(v) => setSurfaceClass(v as "A" | "B")}>
                          <option value="A">Class A (μ = 0.30)</option>
                          <option value="B">Class B (μ = 0.50)</option>
                        </SelectInput>
                      </Field>
                      <Field label="Filler factor h_f" hint="1.0 typical; 0.85 if two or more fillers (AISC).">
                        <TextInput value={slipHf} onChange={setSlipHf} placeholder="1" />
                      </Field>
                    </>
                  ) : null}
                  <Field label="Threads in shear plane" hint="N vs X — affects F_nv and F_nt">
                    <SelectInput value={threadMode} onChange={(v) => setThreadMode(v as BoltThreadMode)}>
                      <option value="N">N — threads in shear plane</option>
                      <option value="X">X — threads excluded from shear plane</option>
                    </SelectInput>
                  </Field>
                  <Field label="Bolt diameter" hint="inches (body)">
                    <SelectInput value={dBolt} onChange={setDBolt}>
                      {boltDiametersIn.map((d) => (
                        <option key={d} value={String(d)}>
                          {d} in (A_b = {(Math.PI * d * d / 4).toFixed(3)} in²)
                        </option>
                      ))}
                    </SelectInput>
                  </Field>
                  <Field
                    label="Number of bolts n"
                    hint="Equal share"
                    error={(() => {
                      const n = Number(nBolts);
                      return !Number.isFinite(n) || n < 1 ? "Enter an integer ≥ 1." : undefined;
                    })()}
                  >
                    <TextInput value={nBolts} onChange={setNBolts} placeholder="e.g. 4" />
                  </Field>
                  <Field label="Shear planes per bolt" hint="Single = 1, double = 2">
                    <SelectInput value={shearPlanes} onChange={(v) => setShearPlanes(v as "1" | "2")}>
                      <option value="1">1 (single shear)</option>
                      <option value="2">2 (double shear)</option>
                    </SelectInput>
                  </Field>
                  {shearMode === "bearing" ? (
                    <Field label="Include bearing check" hint="Uncheck for shear-only">
                      <SelectInput value={checkBearing ? "yes" : "no"} onChange={(v) => setCheckBearing(v === "yes")}>
                        <option value="yes">Yes (govern with shear)</option>
                        <option value="no">No (shear only)</option>
                      </SelectInput>
                    </Field>
                  ) : null}
                  {shearMode === "bearing" ? (
                    <>
                      <Field label="Plate F_u" hint="ksi" error={invalid(plateFu, 0) ? "Enter a number ≥ 0." : undefined}>
                        <TextInputWithUnit value={plateFu} onChange={setPlateFu} unit="ksi" placeholder="65" inputMode="decimal" />
                      </Field>
                      <Field label="Plate thickness t" hint="in" error={invalid(plateT, 0) ? "Enter a number ≥ 0." : undefined}>
                        <TextInputWithUnit value={plateT} onChange={setPlateT} unit="in" placeholder="0.5" inputMode="decimal" />
                      </Field>
                      <Field
                        label="Min clear L_c"
                        hint="in — clear distance in load direction (J3.10(a))"
                        error={invalid(lcMin, 0) ? "Enter a number ≥ 0." : undefined}
                      >
                        <TextInputWithUnit value={lcMin} onChange={setLcMin} unit="in" placeholder="1.25" inputMode="decimal" />
                      </Field>
                    </>
                  ) : null}
                </div>
              </CardBody>
            </Card>

            <Card id="conn-weld">
              <CardHeader title="Fillet weld" description="R_n = 0.6FEXX(0.707a)L; φ = 0.75. Electrode also used for groove checks." />
              <CardBody>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="F_EXX (electrode)" hint="ksi">
                    <SelectInput value={fexx} onChange={setFexx}>
                      <option value="70">70 (E70XX)</option>
                      <option value="80">80 (E80XX)</option>
                    </SelectInput>
                  </Field>
                  <Field label="Leg size a" hint="inches">
                    <TextInputWithUnit value={legIn} onChange={setLegIn} unit="in" placeholder="0.25" inputMode="decimal" />
                  </Field>
                  <Field label="Weld length L" hint="inches">
                    <TextInputWithUnit value={weldLen} onChange={setWeldLen} unit="in" placeholder="4" inputMode="decimal" />
                  </Field>
                  <Field label="Demand on weld" hint="kips">
                    <TextInputWithUnit value={weldDemand} onChange={setWeldDemand} unit="kips" placeholder="50" inputMode="decimal" />
                  </Field>
                </div>
                {weldOut ? (
                  <Card className="mt-6 border-[color:var(--border)] bg-[color:var(--surface)] shadow-sm">
                    <CardBody className="space-y-2 text-sm text-[color:var(--foreground)]">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">Fillet weld status</span>
                        {weldDemandOk ? <Badge tone="good">ADEQUATE</Badge> : <Badge tone="bad">NOT ADEQUATE</Badge>}
                      </div>
                      <p className="text-[color:var(--muted)]">
                        Throat = {weldOut.throat.toFixed(4)} in — {designMethod === "LRFD" ? "φR_n" : "R_a"} ={" "}
                        {(designMethod === "LRFD" ? weldOut.phiRn : lrfdToAsdSamePhiOmega(weldOut.phiRn, 0.75, 2)).toFixed(3)} kips
                      </p>
                      <p className="font-semibold">Min length at this leg ≈ {weldOut.lengthRequiredIn.toFixed(3)} in</p>
                    </CardBody>
                  </Card>
                ) : null}
              </CardBody>
            </Card>
          </div>

          <div className="space-y-4 lg:col-span-5 lg:sticky lg:top-28" id="results">
            <ResultHero
              status={overallStatus}
              title="Overall"
              governing={
                interactionOut && Number(tu) > 0
                  ? `Interaction Σ = ${interactionOut.interactionSum.toFixed(4)}`
                  : shearMode === "slip" && slipOut
                    ? "Slip-critical (J3.8)"
                    : boltOut
                      ? `Bolt check (${boltOut.controlling})`
                      : "Enter inputs to evaluate"
              }
              capacityLabel="Key capacity"
              capacity={
                shearMode === "slip" && slipOut
                  ? `${slipOut.availableSlip.toFixed(3)} kips (available slip)`
                  : boltOut
                    ? `${(
                        designMethod === "LRFD"
                          ? boltOut.phiRnTotalGoverning
                          : lrfdToAsdSamePhiOmega(boltOut.phiRnTotalGoverning)
                      ).toFixed(3)} kips (governing shear/bearing)`
                    : "—"
              }
              demandLabel="Demand"
              demand={`${Number(vu).toFixed(3)} kips shear${Number(tu) > 0 ? ` · ${Number(tu).toFixed(3)} kips tension` : ""}`}
              utilization={
                interactionOut && Number(tu) > 0
                  ? interactionOut.interactionSum
                  : shearMode === "slip" && slipOut
                    ? Number(vu) / slipOut.availableSlip
                    : boltOut
                      ? Number(vu) /
                        (designMethod === "LRFD"
                          ? boltOut.phiRnTotalGoverning
                          : lrfdToAsdSamePhiOmega(boltOut.phiRnTotalGoverning))
                      : undefined
              }
            />

            <CalculatorActionRail
              title="Actions"
              subtitle={`${designMethod} · ${shearMode === "slip" ? "Slip-critical" : "Bearing"} · ${boltGroup} d=${dBolt} in`}
              savedKey={CLIENT_PERSISTENCE.savedAt("connections")}
              saving={saving}
              savedAt={savedAt}
              compare={{
                storageKey: CLIENT_PERSISTENCE.compareSnapshot("connections"),
                getCurrent: () => ({
                  title: "Connections",
                  lines: [
                    `Method: ${designMethod} · Shear mode: ${shearMode}`,
                    `Vu: ${vu} kips · Tu: ${tu} kips`,
                    `Bolt: ${boltGroup} d=${dBolt} in n=${nBolts} planes=${shearPlanes} threads=${threadMode}`,
                  ],
                }),
              }}
              copyText={() =>
                [
                  "Connections",
                  `Method: ${designMethod}`,
                  `Shear mode: ${shearMode}`,
                  `Vu: ${vu} kips`,
                  `Tu: ${tu} kips`,
                ].join("\n")
              }
              onGoResults={() => smoothScrollTo("results")}
              onGoSteps={() => {
                setDetailsTab("bolts");
                smoothScrollTo("details");
              }}
              saveSlots={{
                moduleKey: "connections",
                draftStorageKey: STORAGE.connections,
                getCurrent: () => ({
                  designMethod,
                  shearMode,
                  surfaceClass,
                  slipHf,
                  vu,
                  tu,
                  boltGroup,
                  threadMode,
                  dBolt,
                  nBolts,
                  shearPlanes,
                  checkBearing,
                  plateFu,
                  plateT,
                  lcMin,
                  fexx,
                  legIn,
                  weldLen,
                  weldDemand,
                  grooveThroatIn,
                  grooveLenIn,
                  grooveDemand,
                  pryingTPerBoltOverride,
                  pryingBPrimeIn,
                  pryingStripWidthIn,
                  pryingFyKsi,
                }),
              }}
              onReset={resetInputs}
            />
          </div>
        </div>

        <ModuleDetailsTabs
          title="Details"
          description="Bolt results, fillet weld, and optional helpers."
          value={detailsTab}
          onChange={setDetailsTab}
          tabs={[
            {
              id: "bolts",
              label: "Bolt results",
              panel: (
                <Card id="conn-results">
                  <CardHeader title="Bolt check results" description="Capacities vs Vu and Tu; interaction applies when Tu > 0." />
                  <CardBody>
                    <div className="grid gap-4 lg:grid-cols-2">
                      {shearMode === "slip" && slipOut ? (
                        <Card className="border-[color:var(--border)] bg-[color:var(--surface-2)] shadow-sm">
                          <CardBody className="space-y-2 text-sm text-[color:var(--foreground)]">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold">Slip-critical (J3.8)</span>
                              {shearAdequate ? <Badge tone="good">ADEQUATE</Badge> : <Badge tone="bad">NOT ADEQUATE</Badge>}
                            </div>
                            <p className="text-[color:var(--muted)]">
                              T_b = {slipOut.Tb.toFixed(0)} kips, μ = {slipOut.mu.toFixed(2)}, R_n/bolt = {slipOut.rnPerBolt.toFixed(3)} kips
                            </p>
                            <p className="font-semibold">
                              Available slip ({designMethod === "LRFD" ? "φR_n" : "R_n/Ω"}) = {slipOut.availableSlip.toFixed(3)} kips
                            </p>
                          </CardBody>
                        </Card>
                      ) : null}
                      {boltOut ? (
                        <Card className="border-[color:var(--border)] bg-[color:var(--surface-2)] shadow-sm">
                          <CardBody className="space-y-2 text-sm text-[color:var(--foreground)]">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold">Shear / bearing</span>
                              {shearAdequate ? <Badge tone="good">ADEQUATE</Badge> : <Badge tone="bad">NOT ADEQUATE</Badge>}
                            </div>
                            <p className="text-[color:var(--muted)]">
                              F_nv = {boltOut.shear.Fnv.toFixed(0)} ksi — φR_n (shear) = {boltOut.shear.phiRnTotal.toFixed(3)} kips
                            </p>
                            {boltOut.bearing ? (
                              <p className="text-[color:var(--muted)]">
                                φR_n (bearing) = {boltOut.bearing.phiRnTotal.toFixed(3)} kips ({boltOut.bearing.limit})
                              </p>
                            ) : (
                              <p className="text-[color:var(--muted)]">Bearing off.</p>
                            )}
                            <p className="font-semibold">
                              Governing {designMethod === "LRFD" ? "φR_n" : "R_a"} ={" "}
                              {(designMethod === "LRFD"
                                ? boltOut.phiRnTotalGoverning
                                : lrfdToAsdSamePhiOmega(boltOut.phiRnTotalGoverning)
                              ).toFixed(3)}{" "}
                              kips ({boltOut.controlling})
                            </p>
                          </CardBody>
                        </Card>
                      ) : null}
                      {interactionOut && Number(tu) > 0 ? (
                        <div className="lg:col-span-2">
                          <Card className="border-[color:var(--border)] bg-[color:var(--surface-2)] shadow-sm">
                            <CardBody className="space-y-2 text-sm text-[color:var(--foreground)]">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold">Shear + tension interaction</span>
                                {interactionOut.isSafe ? <Badge tone="good">OK</Badge> : <Badge tone="bad">EXCEEDED</Badge>}
                              </div>
                              <p className="text-[color:var(--muted)]">
                                Interaction sum = {interactionOut.interactionSum.toFixed(4)} (limit 1.0)
                              </p>
                            </CardBody>
                          </Card>
                        </div>
                      ) : null}
                    </div>
                  </CardBody>
                </Card>
              ),
            },
            {
              id: "weld",
              label: "Weld",
              panel: (
                <Card id="conn-weld-details">
                  <CardHeader title="Fillet weld" description="R_n = 0.6FEXX(0.707a)L; φ = 0.75." />
                  <CardBody className="space-y-6">
                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field label="F_EXX (electrode)" hint="ksi">
                        <SelectInput value={fexx} onChange={setFexx}>
                          <option value="70">70 (E70XX)</option>
                          <option value="80">80 (E80XX)</option>
                        </SelectInput>
                      </Field>
                      <Field label="Leg size a" hint="inches">
                        <TextInputWithUnit value={legIn} onChange={setLegIn} unit="in" placeholder="0.25" inputMode="decimal" />
                      </Field>
                      <Field label="Weld length L" hint="inches">
                        <TextInputWithUnit value={weldLen} onChange={setWeldLen} unit="in" placeholder="4" inputMode="decimal" />
                      </Field>
                      <Field label="Demand on weld" hint="kips">
                        <TextInputWithUnit value={weldDemand} onChange={setWeldDemand} unit="kips" placeholder="50" inputMode="decimal" />
                      </Field>
                    </div>

                    {weldOut ? (
                      <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-2)] p-4 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-[color:var(--foreground)]">Status</p>
                          {weldDemandOk ? <Badge tone="good">ADEQUATE</Badge> : <Badge tone="bad">NOT ADEQUATE</Badge>}
                        </div>
                        <p className="mt-2 text-sm text-[color:var(--muted)]">
                          Throat = {weldOut.throat.toFixed(4)} in — {designMethod === "LRFD" ? "φR_n" : "R_a"} ={" "}
                          {(designMethod === "LRFD" ? weldOut.phiRn : lrfdToAsdSamePhiOmega(weldOut.phiRn, 0.75, 2)).toFixed(3)} kips
                        </p>
                        <p className="mt-1 text-sm font-semibold text-[color:var(--foreground)]">
                          Min length at this leg ≈ {weldOut.lengthRequiredIn.toFixed(3)} in
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-[color:var(--muted)]">Enter weld inputs to compute capacity.</p>
                    )}
                  </CardBody>
                </Card>
              ),
            },
            {
              id: "optional",
              label: "Optional",
              panel: (
                <div className="grid gap-6">
                  <Card>
                    <CardHeader title="Groove weld (shear on throat)" description="R_n = 0.6FEXX A_w; uses the same electrode as fillet weld." />
                    <CardBody className="space-y-4">
                      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        <Field label="Effective throat" hint="in — from detail">
                          <TextInputWithUnit value={grooveThroatIn} onChange={setGrooveThroatIn} unit="in" placeholder="0.25" inputMode="decimal" />
                        </Field>
                        <Field label="Length L" hint="in — total effective length in shear">
                          <TextInputWithUnit value={grooveLenIn} onChange={setGrooveLenIn} unit="in" placeholder="4" inputMode="decimal" />
                        </Field>
                        <Field label="Shear demand" hint="kips on weld group">
                          <TextInputWithUnit value={grooveDemand} onChange={setGrooveDemand} unit="kips" placeholder="50" inputMode="decimal" />
                        </Field>
                      </div>
                      {grooveOut ? (
                        <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-2)] p-4 shadow-sm">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-[color:var(--foreground)]">Groove weld metal (shear)</p>
                            {grooveOut.isSafe ? <Badge tone="good">ADEQUATE</Badge> : <Badge tone="bad">NOT ADEQUATE</Badge>}
                          </div>
                          <p className="mt-2 text-sm text-[color:var(--muted)]">
                            A_w = {grooveOut.AwIn2.toFixed(4)} in² — R_n = {grooveOut.RnKips.toFixed(3)} kips —{" "}
                            {designMethod === "LRFD" ? "φR_n" : "R_a"} = {grooveOut.phiRnOrAllowableKips.toFixed(3)} kips
                          </p>
                          <p className="mt-2 text-xs font-semibold text-[color:var(--muted)]">{grooveOut.note}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-[color:var(--muted)]">Enter throat/length/demand to compute.</p>
                      )}
                    </CardBody>
                  </Card>

                  <Card>
                    <CardHeader title="Prying — approximate plate thickness" description="Plastic-hinge strip model (approx.). Leave T/bolt blank to use Tu/n when Tu > 0." />
                    <CardBody className="space-y-4">
                      <div className="grid gap-5 sm:grid-cols-2">
                        <Field label="T per bolt (optional)" hint="kips — blank uses Tu / n">
                          <TextInputWithUnit value={pryingTPerBoltOverride} onChange={setPryingTPerBoltOverride} unit="kips" placeholder="" inputMode="decimal" />
                        </Field>
                        <Field label="b′ (lever arm)" hint="in — bolt line to hinge">
                          <TextInputWithUnit value={pryingBPrimeIn} onChange={setPryingBPrimeIn} unit="in" placeholder="1.5" inputMode="decimal" />
                        </Field>
                        <Field label="Strip width w" hint="in — gage or tributary width">
                          <TextInputWithUnit value={pryingStripWidthIn} onChange={setPryingStripWidthIn} unit="in" placeholder="4" inputMode="decimal" />
                        </Field>
                        <Field label="Plate F_y" hint="ksi">
                          <TextInputWithUnit value={pryingFyKsi} onChange={setPryingFyKsi} unit="ksi" placeholder="50" inputMode="decimal" />
                        </Field>
                      </div>
                      {pryingOut && pryingTPerBoltKips != null ? (
                        <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-2)] p-4 shadow-sm">
                          <p className="text-sm text-[color:var(--muted)]">
                            T/bolt = <span className="font-semibold tabular-nums text-[color:var(--foreground)]">{pryingTPerBoltKips.toFixed(4)}</span> kips
                          </p>
                          <p className="mt-1 text-sm text-[color:var(--muted)]">
                            t_min ≈ <span className="font-semibold tabular-nums text-[color:var(--foreground)]">{pryingOut.tMinApproxIn.toFixed(4)}</span> in
                          </p>
                          <p className="mt-2 text-xs font-semibold text-[color:var(--muted)]">{pryingOut.note}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-[color:var(--muted)]">Enter inputs to compute prying thickness.</p>
                      )}
                    </CardBody>
                  </Card>
                </div>
              ),
            },
          ]}
          className="mt-8"
        />
      </div>
    </AppShell>
  );
}
