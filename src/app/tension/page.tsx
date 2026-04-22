"use client";

import { useMemo, useState } from "react";
import { aiscShapes } from "@/lib/aisc/data";
import {
  filterShapesByFamily,
  shapeFamilyOptions,
  type ShapeFamilyKey,
} from "@/lib/aisc/shape-filters";
import { steelMaterialMap, steelMaterials, type SteelMaterialKey } from "@/lib/data/materials";
import { staggeredNetWidthInches } from "@/lib/limit-state-engine/net-area";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Field, SelectInput, TextInput } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { StepsTable } from "@/components/StepsTable";
import { CLIENT_PERSISTENCE } from "@/lib/client-persistence";
import { STORAGE } from "@/lib/storage/keys";
import { AppShell } from "@/components/layout/AppShell";
import { ResultHero } from "@/components/results/ResultHero";
import { TextInputWithUnit } from "@/components/ui/InputGroup";
import { Button } from "@/components/ui/Button";
import { UtilizationBar } from "@/components/ui/UtilizationBar";
import { CalculatorActionRail } from "@/components/actions/CalculatorActionRail";
import { useBrowserDraft } from "@/features/module-runtime/useBrowserDraft";
import { smoothScrollTo } from "@/features/module-runtime/scroll";
import { evaluateTension, tensionDefaults, tensionDraftSchema } from "@/features/steel/tension/module-config";
import { formatRelativeTime } from "@/lib/format/relativeTime";
import { ModuleHero } from "@/components/layout/ModuleHero";
import { ModuleDetailsTabs } from "@/components/layout/ModuleDetailsTabs";

const toNumber = (v: string) => Number(v) || 0;
/** Client preference: ~3 decimals on final strengths / demands. */
const fmt = (n: number, digits = 3) => (Number.isFinite(n) ? n.toFixed(digits) : "-");
/** Unified metadata chips (header rail). */
const META_CHIP =
  "inline-flex h-8 items-center rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-2)] px-2.5 text-[11px] font-semibold text-[color:var(--foreground)]/80 shadow-sm";

function isInvalidNumber(v: string, opts?: { min?: number; allowBlank?: boolean }) {
  const allowBlank = opts?.allowBlank ?? false;
  if (allowBlank && v.trim() === "") return false;
  const n = Number(v);
  if (!Number.isFinite(n)) return true;
  if (opts?.min != null && n < opts.min) return true;
  return false;
}

export default function TensionModulePage() {
  const [material, setMaterial] = useState<SteelMaterialKey>(tensionDefaults.material as SteelMaterialKey);
  const [shapeName, setShapeName] = useState(tensionDefaults.shapeName);
  const [Ag, setAg] = useState(tensionDefaults.Ag);
  const [An, setAn] = useState(tensionDefaults.An);
  const [U, setU] = useState(tensionDefaults.U);
  const [Pu, setPu] = useState(tensionDefaults.Pu);
  const [Agv, setAgv] = useState(tensionDefaults.Agv);
  const [Anv, setAnv] = useState(tensionDefaults.Anv);
  const [Agt, setAgt] = useState(tensionDefaults.Agt);
  const [Ant, setAnt] = useState(tensionDefaults.Ant);
  const [ubs, setUbs] = useState(tensionDefaults.ubs);
  const [detailsTab, setDetailsTab] = useState<"steps" | "modes" | "section">("steps");

  const [stagW, setStagW] = useState(tensionDefaults.stagW);
  const [stagDh, setStagDh] = useState(tensionDefaults.stagDh);
  const [stagN, setStagN] = useState(tensionDefaults.stagN);
  const [stagS, setStagS] = useState(tensionDefaults.stagS);
  const [stagG, setStagG] = useState(tensionDefaults.stagG);
  const [stagT, setStagT] = useState(tensionDefaults.stagT);
  const [shapeFamily, setShapeFamily] = useState<ShapeFamilyKey>(tensionDefaults.shapeFamily as ShapeFamilyKey);
  const [designMethod, setDesignMethod] = useState<"LRFD" | "ASD">(tensionDefaults.designMethod);
  const [mode, setMode] = useState<"check" | "design">(tensionDefaults.mode);
  const { saving, savedAt, clearDraft } = useBrowserDraft({
    storageKey: STORAGE.tension,
    savedAtKey: CLIENT_PERSISTENCE.savedAt("tension"),
    schema: tensionDraftSchema,
    hydrate: (p) => {
      if (typeof p.material === "string") setMaterial(p.material as SteelMaterialKey);
      if (typeof p.shapeName === "string") setShapeName(p.shapeName);
      if (typeof p.Ag === "string") setAg(p.Ag);
      if (typeof p.An === "string") setAn(p.An);
      if (typeof p.U === "string") setU(p.U);
      if (typeof p.Pu === "string") setPu(p.Pu);
      if (typeof p.Agv === "string") setAgv(p.Agv);
      if (typeof p.Anv === "string") setAnv(p.Anv);
      if (typeof p.Agt === "string") setAgt(p.Agt);
      if (typeof p.Ant === "string") setAnt(p.Ant);
      if (typeof p.ubs === "string") setUbs(p.ubs);
      if (typeof p.stagW === "string") setStagW(p.stagW);
      if (typeof p.stagDh === "string") setStagDh(p.stagDh);
      if (typeof p.stagN === "string") setStagN(p.stagN);
      if (typeof p.stagS === "string") setStagS(p.stagS);
      if (typeof p.stagG === "string") setStagG(p.stagG);
      if (typeof p.stagT === "string") setStagT(p.stagT);
      if (typeof p.shapeFamily === "string") setShapeFamily(p.shapeFamily as ShapeFamilyKey);
      if (p.designMethod === "LRFD" || p.designMethod === "ASD") setDesignMethod(p.designMethod);
      if (p.mode === "check" || p.mode === "design") setMode(p.mode);
    },
    serialize: () => ({
      material,
      shapeName,
      Ag,
      An,
      U,
      Pu,
      Agv,
      Anv,
      Agt,
      Ant,
      ubs,
      stagW,
      stagDh,
      stagN,
      stagS,
      stagG,
      stagT,
      shapeFamily,
      designMethod,
      mode,
    }),
    watch: [
      material,
      shapeName,
      Ag,
      An,
      U,
      Pu,
      Agv,
      Anv,
      Agt,
      Ant,
      ubs,
      stagW,
      stagDh,
      stagN,
      stagS,
      stagG,
      stagT,
      shapeFamily,
      designMethod,
      mode,
    ],
  });

  const selectedMaterial = steelMaterialMap[material];
  const shapeChoices = useMemo(
    () => filterShapesByFamily(aiscShapes, shapeFamily, "tension"),
    [shapeFamily],
  );
  const shape = aiscShapes.find((s) => s.shape === shapeName);

  const handleShapeFamilyChange = (v: ShapeFamilyKey) => {
    setShapeFamily(v);
    const list = filterShapesByFamily(aiscShapes, v, "tension");
    if (list.length === 0) return;
    if (!list.some((s) => s.shape === shapeName)) {
      const first = list[0];
      setShapeName(first.shape);
      setAg(String(first.A));
    }
  };

  const result = useMemo(() => {
    return evaluateTension({
      designMethod,
      Fy: selectedMaterial.Fy,
      Fu: selectedMaterial.Fu,
      Ag: toNumber(Ag),
      An: toNumber(An),
      U: toNumber(U),
      demandPu: toNumber(Pu),
      Agv: toNumber(Agv),
      Anv: toNumber(Anv),
      Agt: toNumber(Agt),
      Ant: toNumber(Ant),
      ubs: toNumber(ubs) || 0.5,
    });
  }, [selectedMaterial, designMethod, Ag, An, U, Pu, Agv, Anv, Agt, Ant, ubs]);

  /** Lightest section in family that passes all limit states with gross = net (optimistic — refine in Check). */
  const designSuggestion = useMemo(() => {
    if (mode !== "design") return null;
    const demand = toNumber(Pu);
    const list = [...shapeChoices].sort((a, b) => a.W - b.W);
    for (const s of list) {
      const r = evaluateTension({
        designMethod,
        Fy: selectedMaterial.Fy,
        Fu: selectedMaterial.Fu,
        Ag: s.A,
        An: s.A,
        U: 1,
        demandPu: demand,
        Agv: toNumber(Agv),
        Anv: toNumber(Anv),
        Agt: toNumber(Agt),
        Ant: toNumber(Ant),
        ubs: toNumber(ubs) || 0.5,
      });
      if (r.isSafe) return s;
    }
    return null;
  }, [mode, shapeChoices, Pu, selectedMaterial, designMethod, Agv, Anv, Agt, Ant, ubs]);

  /** Design mode: compare first 16 lightest shapes (same assumptions as design suggestion). */
  const designComparisonRows = useMemo(() => {
    if (mode !== "design" || shapeChoices.length === 0) return [];
    const demand = toNumber(Pu);
    return [...shapeChoices]
      .sort((a, b) => a.W - b.W)
      .slice(0, 16)
      .map((s) => {
        const r = evaluateTension({
          designMethod,
          Fy: selectedMaterial.Fy,
          Fu: selectedMaterial.Fu,
          Ag: s.A,
          An: s.A,
          U: 1,
          demandPu: demand,
          Agv: toNumber(Agv),
          Anv: toNumber(Anv),
          Agt: toNumber(Agt),
          Ant: toNumber(Ant),
          ubs: toNumber(ubs) || 0.5,
        });
        return {
          shape: s.shape,
          W: s.W,
          strength: r.controllingStrength,
          safe: r.isSafe,
          gov: r.governingCase,
        };
      });
  }, [mode, shapeChoices, Pu, selectedMaterial, designMethod, Agv, Anv, Agt, Ant, ubs]);

  const staggerHelp = useMemo(() => {
    const W = toNumber(stagW);
    const dh = toNumber(stagDh);
    const n = Math.floor(toNumber(stagN));
    const s = toNumber(stagS);
    const g = toNumber(stagG);
    const t = toNumber(stagT);
    if (!stagW.trim() || W <= 0 || dh <= 0 || n < 0 || t <= 0) return null;
    const nw = staggeredNetWidthInches({
      grossWidthIn: W,
      holeDiameterIn: dh,
      nHoles: n,
      staggers: s > 0 && g > 0 ? [{ sIn: s, gIn: g }] : undefined,
    });
    return { netWidth: nw, an: nw * t };
  }, [stagW, stagDh, stagN, stagS, stagG, stagT]);

  const failureModeRows = useMemo(() => {
    const demand = result.demand;
    return Object.entries(result.results)
      .map(([key, value]) => {
        const cap = value.phiPn;
        const ratio = Number.isFinite(cap) && cap > 0 ? demand / cap : Number.POSITIVE_INFINITY;
        return { key, name: value.name, unit: value.unit, cap, ratio };
      })
      .sort((a, b) => b.ratio - a.ratio);
  }, [result]);

  const resetInputs = () => {
    clearDraft();
    setMaterial(tensionDefaults.material as SteelMaterialKey);
    setShapeName(tensionDefaults.shapeName);
    setAg(tensionDefaults.Ag);
    setAn(tensionDefaults.An);
    setU(tensionDefaults.U);
    setPu(tensionDefaults.Pu);
    setAgv(tensionDefaults.Agv);
    setAnv(tensionDefaults.Anv);
    setAgt(tensionDefaults.Agt);
    setAnt(tensionDefaults.Ant);
    setUbs(tensionDefaults.ubs);
    setStagW(tensionDefaults.stagW);
    setStagDh(tensionDefaults.stagDh);
    setStagN(tensionDefaults.stagN);
    setStagS(tensionDefaults.stagS);
    setStagG(tensionDefaults.stagG);
    setStagT(tensionDefaults.stagT);
    setShapeFamily(tensionDefaults.shapeFamily as ShapeFamilyKey);
    setDesignMethod(tensionDefaults.designMethod);
    setMode(tensionDefaults.mode);
  };

  return (
    <AppShell>
      <div className="space-y-8 md:space-y-10">
        <ModuleHero
          eyebrow="steel module"
          title={
            <>
              Tension{" "}
              <span className="text-[color:var(--foreground)]">Analysis &amp; Design</span>
            </>
          }
          description="Yielding, rupture, block shear (J4.3), with an optional stagger helper. Inputs save in this browser."
          chips={[
            {
              key: "saved",
              label: saving ? "Saving…" : savedAt ? `Saved ${formatRelativeTime(savedAt) ?? "recently"}` : "Not saved yet",
            },
            { key: "mat", label: selectedMaterial.key },
            { key: "method", label: designMethod },
            { key: "mode", label: mode === "design" ? "Design" : "Check" },
          ]}
          image={{ src: "/assets/tension.png" }}
        />

        <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
          <div className="space-y-6 lg:col-span-7">
            <Card id="tension-general">
              <CardHeader title="General" description="Steel, shape selection, method, and required axial." right={<Badge tone="info">Inputs</Badge>} />
              <CardBody>
                <div className="grid gap-5 md:grid-cols-2">
                  <Field
                    label="Required Pu / Pa"
                    hint="Required axial (kips) — LRFD Pu or ASD Pa depending on method."
                    error={isInvalidNumber(Pu, { min: 0 }) ? "Enter a number ≥ 0." : undefined}
                    className="md:col-span-2"
                  >
                    <div className="rounded-2xl bg-[color:var(--surface-2)] p-3 ring-1 ring-inset ring-[color:var(--border)]/60 sm:p-4">
                      <TextInputWithUnit
                        value={Pu}
                        onChange={setPu}
                        unit="kips"
                        placeholder="e.g. 900"
                        inputMode="decimal"
                        className={
                          isInvalidNumber(Pu, { min: 0 })
                            ? "border-rose-300 focus:border-rose-400 focus:ring-rose-500/10"
                            : undefined
                        }
                      />
                    </div>
                  </Field>

                  <Field label="Steel Type" hint="Auto-fills Fy and Fu (ksi).">
                    <SelectInput value={material} onChange={(v) => setMaterial(v as SteelMaterialKey)}>
                      {steelMaterials.map((m) => (
                        <option key={m.key} value={m.key}>
                          {m.label} (Fy={m.Fy}, Fu={m.Fu})
                        </option>
                      ))}
                    </SelectInput>
                  </Field>

                  <Field label="Shape family" hint="Filter AISC v16 database (W, S, C, L, HSS, …).">
                    <SelectInput value={shapeFamily} onChange={(v) => handleShapeFamilyChange(v as ShapeFamilyKey)}>
                      {shapeFamilyOptions.map((o) => (
                        <option key={o.key} value={o.key}>
                          {o.label}
                        </option>
                      ))}
                    </SelectInput>
                  </Field>

                  <Field label="AISC Shape" hint="Ag auto-updates from the database.">
                    <SelectInput
                      value={shapeName}
                      onChange={(v) => {
                        const selected = aiscShapes.find((s) => s.shape === v);
                        setShapeName(v);
                        if (selected) setAg(String(selected.A));
                      }}
                    >
                      {shapeChoices.map((s) => (
                        <option key={s.shape} value={s.shape}>
                          {s.shape}
                        </option>
                      ))}
                    </SelectInput>
                  </Field>

                  <Field label="Mode" hint="Check a section, or get a lightest-weight suggestion in the chosen family.">
                    <SelectInput value={mode} onChange={(v) => setMode(v as "check" | "design")}>
                      <option value="check">Check / analyze</option>
                      <option value="design">Design (lightest shape)</option>
                    </SelectInput>
                  </Field>

                  <Field label="Design method" hint="LRFD (default) or ASD.">
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
                      <span className="tabular-nums">W: {fmt(shape.W, 1)} plf</span>
                      <span className="tabular-nums">Ag: {fmt(shape.A, 3)} in²</span>
                      <span className="tabular-nums">rx: {fmt(shape.rx, 3)} in</span>
                      <span className="tabular-nums">ry: {fmt(shape.ry, 3)} in</span>
                    </div>
                  </div>
                ) : null}
              </CardBody>
            </Card>

            <Card id="tension-net-area">
              <CardHeader title="Net area" description="Areas and shear lag factor (yielding / rupture)." />
              <CardBody>
                <div className="mb-3 flex flex-wrap gap-2">
                  <Button variant="secondary" size="sm" type="button" onClick={() => setU("0.90")}>
                    Typical U = 0.90
                  </Button>
                  <Button variant="secondary" size="sm" type="button" onClick={() => setAn(Ag)}>
                    Set An = Ag (no holes yet)
                  </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Shear lag factor U" hint="dimensionless">
                    <TextInput value={U} onChange={setU} placeholder="e.g. 0.90" />
                  </Field>
                  <Field label="Ag" hint="gross area (in²)" error={isInvalidNumber(Ag, { min: 0 }) ? "Enter a number ≥ 0." : undefined}>
                    <TextInputWithUnit
                      value={Ag}
                      onChange={setAg}
                      unit="in²"
                      inputMode="decimal"
                      className={isInvalidNumber(Ag, { min: 0 }) ? "border-rose-300 focus:border-rose-400 focus:ring-rose-500/10" : undefined}
                    />
                  </Field>
                  <Field label="An" hint="net area (in²)" error={isInvalidNumber(An, { min: 0 }) ? "Enter a number ≥ 0." : undefined}>
                    <TextInputWithUnit
                      value={An}
                      onChange={setAn}
                      unit="in²"
                      inputMode="decimal"
                      className={isInvalidNumber(An, { min: 0 }) ? "border-rose-300 focus:border-rose-400 focus:ring-rose-500/10" : undefined}
                    />
                  </Field>
                  <div className="rounded-2xl bg-[color:var(--surface-2)] p-4 text-sm text-[color:var(--muted)] ring-1 ring-inset ring-[color:var(--border)]/60">
                    <p className="text-xs font-semibold uppercase tracking-wide">Tip</p>
                    <p className="mt-2 text-sm">
                      If you don’t have hole details yet, use <strong>An ≈ Ag</strong> for quick sizing, then refine in Check mode.
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            {designSuggestion ? (
              <Card id="tension-design-suggestion">
                <CardHeader title="Suggested section" description="Lightest in family that passes (gross = net assumption)." />
                <CardBody>
                  <p className="text-2xl font-extrabold tracking-tight text-[color:var(--foreground)]">{designSuggestion.shape}</p>
                  <p className="mt-2 text-sm text-[color:var(--muted)]">
                    {designSuggestion.W} lb/ft — uses gross = net areas and your block-shear inputs; switch to Check to enter real A<sub>n</sub> and holes.
                  </p>
                </CardBody>
              </Card>
            ) : null}

            {mode === "design" && designComparisonRows.length > 0 ? (
              <Card id="tension-section-compare">
                <CardHeader title="Section comparison" description="Lightest first (gross = net assumption)." />
                <CardBody>
                  <div className="overflow-x-auto rounded-xl ring-1 ring-inset ring-[color:var(--border)]/70 bg-[color:var(--surface)]">
                    <table className="w-full min-w-[28rem] text-left text-sm text-[color:var(--foreground)]">
                      <thead className="sticky top-0 z-10 bg-[color:var(--surface-2)] text-xs font-semibold uppercase text-[color:var(--muted)] shadow-[0_1px_0_rgba(15,23,42,0.06)]">
                        <tr>
                          <th className="px-3 py-2">Shape</th>
                          <th className="px-3 py-2">W (plf)</th>
                          <th className="px-3 py-2">Governing</th>
                          <th className="px-3 py-2">Strength</th>
                          <th className="px-3 py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {designComparisonRows.map((row) => (
                          <tr key={row.shape} className="border-t border-[color:var(--border)]/60">
                            <td className="px-3 py-2 font-semibold">{row.shape}</td>
                            <td className="px-3 py-2">{fmt(row.W, 1)}</td>
                            <td className="px-3 py-2">{row.gov}</td>
                            <td className="px-3 py-2">{fmt(row.strength)} kips</td>
                            <td className="px-3 py-2">
                              {row.safe ? (
                                <span className="font-semibold text-emerald-700">SAFE</span>
                              ) : (
                                <span className="font-semibold text-rose-700">NOT SAFE</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardBody>
              </Card>
            ) : null}

            <Card id="tension-block-shear">
              <CardHeader title="Block shear + stagger helper" description="Block shear (J4.3) and optional stagger net width tool (D3)." />
              <CardBody className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" size="sm" type="button" onClick={() => setUbs("0.50")}>
                    Typical Ubs = 0.50
                  </Button>
                </div>

                <div className="rounded-2xl bg-[color:var(--surface-2)] p-4 ring-1 ring-inset ring-[color:var(--border)]/60">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Agv" hint="gross shear area (in²)">
                      <TextInputWithUnit value={Agv} onChange={setAgv} unit="in²" inputMode="decimal" />
                    </Field>
                    <Field label="Anv" hint="net shear area (in²)">
                      <TextInputWithUnit value={Anv} onChange={setAnv} unit="in²" inputMode="decimal" />
                    </Field>
                    <Field label="Agt" hint="gross tension area (in²)">
                      <TextInputWithUnit value={Agt} onChange={setAgt} unit="in²" inputMode="decimal" />
                    </Field>
                    <Field label="Ant" hint="net tension area (in²)">
                      <TextInputWithUnit value={Ant} onChange={setAnt} unit="in²" inputMode="decimal" />
                    </Field>
                    <Field
                      label="Ubs (block shear)"
                      hint="AISC J4.3 U_bs: 0.5 non-uniform tension on A_nt (typical); 1.0 uniform"
                      className="md:col-span-2"
                    >
                      <TextInput
                        value={ubs}
                        onChange={setUbs}
                        placeholder="0.5"
                      />
                    </Field>
                  </div>
                </div>

                <div className="rounded-2xl bg-[color:var(--surface)] p-4 ring-1 ring-inset ring-[color:var(--border)]/60">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-[color:var(--foreground)]">Tool — staggered net width (AISC D3)</p>
                        <p className="mt-1 text-sm text-[color:var(--muted)]">
                          Computes net width for a plate strip. Use as a helper, then copy A<sub>n</sub> to the net area field.
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" type="button" onClick={() => smoothScrollTo("tension-net-area")}>
                        Go to net area
                      </Button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label="Gross width W" hint="in — along failure path">
                        <TextInputWithUnit value={stagW} onChange={setStagW} unit="in" placeholder="e.g. 8" inputMode="decimal" />
                      </Field>
                      <Field label="Hole dia d_h" hint="in">
                        <TextInputWithUnit value={stagDh} onChange={setStagDh} unit="in" inputMode="decimal" />
                      </Field>
                      <Field label="Number of holes n" hint="on that path">
                        <TextInput value={stagN} onChange={setStagN} />
                      </Field>
                      <Field label="Thickness t" hint="in">
                        <TextInputWithUnit value={stagT} onChange={setStagT} unit="in" inputMode="decimal" />
                      </Field>
                      <Field label="Pitch s" hint="in — optional stagger">
                        <TextInputWithUnit value={stagS} onChange={setStagS} unit="in" inputMode="decimal" />
                      </Field>
                      <Field label="Gage g" hint="in — between gage lines">
                        <TextInputWithUnit value={stagG} onChange={setStagG} unit="in" inputMode="decimal" />
                      </Field>
                    </div>

                    {staggerHelp ? (
                      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[color:var(--surface-2)] p-3 text-sm text-[color:var(--foreground)] ring-1 ring-inset ring-[color:var(--border)]/60">
                        <span className="tabular-nums">
                          Net width = {staggerHelp.netWidth.toFixed(4)} in → A<sub>n</sub> = {staggerHelp.an.toFixed(4)} in²
                        </span>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            type="button"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(staggerHelp.netWidth.toFixed(4));
                              } catch {
                                /* ignore */
                              }
                            }}
                          >
                            Copy net width
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            type="button"
                            onClick={() => setAn(String(Math.round(staggerHelp.an * 10000) / 10000))}
                          >
                            Copy A_n to net area
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-[color:var(--muted)]">Enter W, d_h, t, and n to compute.</p>
                    )}
                </div>
              </CardBody>
            </Card>
          </div>

          <div className="space-y-4 lg:col-span-5 lg:sticky lg:top-28" id="results">
            <ResultHero
              status={result.isSafe ? "safe" : "unsafe"}
              governing={result.governingCase}
              capacityLabel={designMethod === "LRFD" ? "Design strength (φPn)" : "Allowable (Pa)"}
              capacity={`${fmt(result.controllingStrength)} kips`}
              demandLabel={designMethod === "LRFD" ? "Demand Pu" : "Demand Pa"}
              demand={`${fmt(result.demand)} kips`}
              utilization={result.controllingStrength > 0 ? result.demand / result.controllingStrength : undefined}
              metaRight={<Badge tone="info">{selectedMaterial.key}</Badge>}
            />

            <CalculatorActionRail
              title="Actions"
              subtitle={`${shapeName} · ${designMethod} · ${mode === "design" ? "Design" : "Check"}`}
              savedKey={CLIENT_PERSISTENCE.savedAt("tension")}
              saving={saving}
              savedAt={savedAt}
              compare={{
                storageKey: CLIENT_PERSISTENCE.compareSnapshot("tension"),
                getCurrent: () => ({
                  title: `Tension — ${shapeName}`,
                  lines: [
                    `Method: ${designMethod} · Material: ${selectedMaterial.key}`,
                    `Mode: ${mode}`,
                    `Pu = ${Pu} kips`,
                    `Governing: ${result.governingCase}`,
                    `Capacity: ${fmt(result.controllingStrength)} kips`,
                    `Demand: ${fmt(result.demand)} kips`,
                    `Utilization: ${
                      result.controllingStrength > 0 ? ((result.demand / result.controllingStrength) * 100).toFixed(1) : "-"
                    }%`,
                  ],
                }),
              }}
              copyText={() =>
                [
                  `Tension — ${shapeName}`,
                  `Method: ${designMethod} · Material: ${selectedMaterial.key}`,
                  `Mode: ${mode}`,
                  `Pu = ${Pu} kips`,
                  `Governing: ${result.governingCase}`,
                  `Capacity: ${fmt(result.controllingStrength)} kips`,
                  `Demand: ${fmt(result.demand)} kips`,
                ].join("\n")
              }
              onGoResults={() => smoothScrollTo("results")}
              onGoSteps={() => {
                setDetailsTab("steps");
                smoothScrollTo("details");
              }}
              saveSlots={{
                moduleKey: "tension",
                draftStorageKey: STORAGE.tension,
                getCurrent: () => ({
                  material,
                  shapeName,
                  Ag,
                  An,
                  U,
                  Pu,
                  Agv,
                  Anv,
                  Agt,
                  Ant,
                  ubs,
                  stagW,
                  stagDh,
                  stagN,
                  stagS,
                  stagG,
                  stagT,
                  shapeFamily,
                  designMethod,
                  mode,
                }),
              }}
              onReset={resetInputs}
            />
          </div>
        </div>

        <ModuleDetailsTabs
          title="Details"
          description="Review steps, capacity breakdown, and section snapshot."
          value={detailsTab}
          onChange={setDetailsTab}
          tabs={[
            {
              id: "steps",
              label: "Steps",
              panel: (
                <Card id="tension-steps">
                  <CardHeader
                    title="Steps"
                    description={
                      <>
                        Governing: <span className="font-semibold text-[color:var(--foreground)]">{result.governingCase}</span> · Capacity{" "}
                        <span className="font-semibold tabular-nums text-[color:var(--foreground)]">{fmt(result.controllingStrength)} kips</span>
                      </>
                    }
                  />
                  <CardBody>
                    <StepsTable steps={result.steps} governingCase={String(result.governingCase)} tools />
                  </CardBody>
                </Card>
              ),
            },
            {
              id: "modes",
              label: "Failure modes",
              panel: (
                <Card id="tension-failure-modes">
                  <CardHeader title="Failure modes" description="Capacity breakdown by limit state." />
                  <CardBody className="space-y-2">
                {failureModeRows.map((row, idx) => (
                  <div
                    key={row.key}
                    className={[
                      "rounded-xl border p-3",
                      idx % 2 === 1 ? "bg-[color:var(--surface-2)]/45" : "",
                      row.name.toLowerCase().includes(String(result.governingCase).toLowerCase())
                        ? "border-[color:var(--brand-ring)] bg-[color:var(--surface-2)]"
                        : "border-[color:var(--border)] bg-[color:var(--surface)]",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-[color:var(--muted)]">{row.name}</div>
                        <div className="mt-1 text-base font-extrabold tabular-nums text-[color:var(--foreground)]">
                          {fmt(row.cap)} {row.unit}
                        </div>
                      </div>
                      <div className="text-right text-xs font-semibold text-[color:var(--muted)]">
                        <div>Util.</div>
                        <div className="tabular-nums text-[color:var(--foreground)]">{(row.ratio * 100).toFixed(1)}%</div>
                      </div>
                    </div>
                    <div className="mt-2">
                      <UtilizationBar ratio={row.ratio} />
                    </div>
                  </div>
                ))}
                  </CardBody>
                </Card>
              ),
            },
            {
              id: "section",
              label: "Section",
              panel: shape ? (
                <Card id="tension-section-snapshot">
                  <CardHeader title="Section snapshot" description="Key AISC properties for quick context." />
                  <CardBody>
                    <div className="grid grid-cols-2 gap-2 text-sm text-[color:var(--foreground)]/90">
                      <Row label="Shape" value={shape.shape} />
                      <Row label="W" value={`${fmt(shape.W)} plf`} />
                      <Row label="d" value={`${fmt(shape.d)} in`} />
                      <Row label="bf" value={`${fmt(shape.bf)} in`} />
                      <Row label="tf" value={`${fmt(shape.tf)} in`} />
                      <Row label="tw" value={`${fmt(shape.tw)} in`} />
                      <Row label="rx" value={`${fmt(shape.rx)} in`} />
                      <Row label="ry" value={`${fmt(shape.ry)} in`} />
                    </div>
                  </CardBody>
                </Card>
              ) : (
                <Card id="tension-section-snapshot">
                  <CardHeader title="Section snapshot" description="Select an AISC shape to show section properties." />
                  <CardBody className="text-sm text-[color:var(--muted)]">—</CardBody>
                </Card>
              ),
            },
          ]}
          className="mt-8"
        />
      </div>
    </AppShell>
  );
}

function Row(props: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-slate-600">{props.label}</span>
      <span className="font-semibold text-slate-900">{props.value}</span>
    </div>
  );
}
