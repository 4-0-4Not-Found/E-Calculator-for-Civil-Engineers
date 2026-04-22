"use client";

import { useMemo, useState } from "react";
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
import { steelMaterialMap, type SteelMaterialKey } from "@/lib/data/materials";
import { fmtKipFt, fmtKips } from "@/lib/format/display";
import { combinedDefaults, combinedDraftSchema, evaluateCombined } from "@/features/steel/combined/module-config";
import { aiscShapes } from "@/lib/aisc/data";
import { formatRelativeTime } from "@/lib/format/relativeTime";
import { Badge } from "@/components/ui/Badge";
import { smoothScrollTo } from "@/features/module-runtime/scroll";
import { ModuleDetailsTabs } from "@/components/layout/ModuleDetailsTabs";

export default function CombinedPage() {
  const [designMethod, setDesignMethod] = useState<"LRFD" | "ASD">(combinedDefaults.designMethod);
  const [material, setMaterial] = useState<SteelMaterialKey>(combinedDefaults.material as SteelMaterialKey);
  const [deadLoadKft, setDeadLoadKft] = useState(combinedDefaults.deadLoadKft);
  const [liveLoadKft, setLiveLoadKft] = useState(combinedDefaults.liveLoadKft);
  const [spanFt, setSpanFt] = useState(combinedDefaults.spanFt);
  const [cbFactor, setCbFactor] = useState(combinedDefaults.cbFactor);
  const [shapeName, setShapeName] = useState(combinedDefaults.shapeName);

  const { savedAt, saving, clearDraft } = useBrowserDraft({
    storageKey: STORAGE.combined,
    savedAtKey: CLIENT_PERSISTENCE.savedAt("combined"),
    schema: combinedDraftSchema,
    hydrate: (p) => {
      if (p.designMethod === "LRFD" || p.designMethod === "ASD") setDesignMethod(p.designMethod);
      if (typeof p.material === "string") setMaterial(p.material as SteelMaterialKey);
      if (typeof p.deadLoadKft === "string") setDeadLoadKft(p.deadLoadKft);
      if (typeof p.liveLoadKft === "string") setLiveLoadKft(p.liveLoadKft);
      if (typeof p.spanFt === "string") setSpanFt(p.spanFt);
      if (typeof p.cbFactor === "string") setCbFactor(p.cbFactor);
      if (typeof p.shapeName === "string") setShapeName(p.shapeName);
    },
    serialize: () => ({ designMethod, material, deadLoadKft, liveLoadKft, spanFt, cbFactor, shapeName }),
    watch: [designMethod, material, deadLoadKft, liveLoadKft, spanFt, cbFactor, shapeName],
  });

  const shapes = useMemo(() => aiscShapes.filter((s) => s.type === "W"), []);
  const out = useMemo(
    () =>
      evaluateCombined({
        designMethod,
        Fy: steelMaterialMap[material].Fy,
        deadLoadKft: Number(deadLoadKft) || 0,
        liveLoadKft: Number(liveLoadKft) || 0,
        spanFt: Number(spanFt) || 0,
        cb: Number(cbFactor) || 1.14,
        selectedShapeName: shapeName,
      }),
    [designMethod, material, deadLoadKft, liveLoadKft, spanFt, cbFactor, shapeName],
  );

  const selected = out?.selected ?? null;
  const ratio = selected && selected.controllingStrength > 0 ? selected.demand / selected.controllingStrength : undefined;
  const [detailsTab, setDetailsTab] = useState<"steps" | "demand">("demand");

  return (
    <AppShell>
      <div className="space-y-8 md:space-y-10">
        <ModuleHero
          eyebrow="steel module"
          title={
            <>
              Combined <span className="text-[color:var(--foreground)]">Bending + Shear</span>
            </>
          }
          description="Workbook source: PROGRAM-2.xlsx / Bending & Shear (DESIGN). Demand comes from D, L, and span; shape checks include flexure, shear, and deflection."
          image={{ src: "/assets/combined.png", alt: "Combined module" }}
        />

        <div className="grid gap-8 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-7">
            <Card id="combined-inputs">
              <CardHeader title="Inputs" description="Use load combinations per workbook." />
              <CardBody className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Field label="Method">
                    <SelectInput value={designMethod} onChange={(v) => setDesignMethod(v as "LRFD" | "ASD")}>
                      <option value="LRFD">LRFD</option>
                      <option value="ASD">ASD</option>
                    </SelectInput>
                  </Field>
                  <Field label="Steel type (Fy)">
                    <SelectInput value={material} onChange={(v) => setMaterial(v as SteelMaterialKey)}>
                      <option value="A36">ASTM A36</option>
                      <option value="A572">ASTM A572 Gr.50</option>
                      <option value="A992">ASTM A992 (W)</option>
                    </SelectInput>
                  </Field>
                  <Field label="W-shape (selected)">
                    <SelectInput value={shapeName} onChange={(v) => setShapeName(v)}>
                      {shapes.map((s) => (
                        <option key={s.shape} value={s.shape}>
                          {s.shape}
                        </option>
                      ))}
                    </SelectInput>
                  </Field>
                  <Field label="Dead load D (kip/ft)">
                    <TextInput value={deadLoadKft} onChange={setDeadLoadKft} />
                  </Field>
                  <Field label="Live load L (kip/ft)">
                    <TextInput value={liveLoadKft} onChange={setLiveLoadKft} />
                  </Field>
                  <Field label="Span (ft)">
                    <TextInput value={spanFt} onChange={setSpanFt} />
                  </Field>
                </div>
                <div className="max-w-xs">
                  <Field label="C_b factor">
                    <TextInput value={cbFactor} onChange={setCbFactor} />
                  </Field>
                </div>
              </CardBody>
            </Card>
          </div>

          <div className="space-y-4 lg:col-span-5 lg:sticky lg:top-28" id="combined-results">
            <ResultHero
              status={!selected ? "invalid" : selected.isSafe ? "safe" : "unsafe"}
              title={`${designMethod} selected shape status`}
              governing={selected?.beamLimitStates?.governing ?? selected?.governingCase ?? "—"}
              capacityLabel={designMethod === "LRFD" ? "Controlling φR_n" : "Controlling allowable"}
              capacity={selected ? `${fmtKipFt(selected.controllingStrength)}` : "—"}
              demandLabel="Controlling demand"
              demand={selected ? `${fmtKipFt(selected.demand)}` : "—"}
              utilization={ratio}
              metaRight={
                <span className="text-xs font-semibold text-[color:var(--muted)]">
                  {saving ? "Saving..." : savedAt ? `Saved ${formatRelativeTime(savedAt)}` : "Auto-save ready"}
                </span>
              }
            />
            <CalculatorActionRail
              title="Actions"
              subtitle={`${shapeName} · ${designMethod}`}
              savedKey={CLIENT_PERSISTENCE.savedAt("combined")}
              saving={saving}
              savedAt={savedAt}
              saveSlots={{
                moduleKey: "combined",
                draftStorageKey: STORAGE.combined,
                getCurrent: () => ({ designMethod, material, deadLoadKft, liveLoadKft, spanFt, cbFactor, shapeName }),
              }}
              copyText={() =>
                [
                  "Combined module",
                  `Method: ${designMethod}`,
                  `Material: ${material}`,
                  `Loads D/L: ${deadLoadKft || "0"} / ${liveLoadKft || "0"} kip/ft`,
                  `Span: ${spanFt || "0"} ft`,
                  `Shape: ${shapeName}`,
                  selected ? `Capacity: ${selected.controllingStrength.toFixed(3)} kip-ft` : "Capacity: —",
                  selected ? `Demand: ${selected.demand.toFixed(3)} kip-ft` : "Demand: —",
                  selected ? `Status: ${selected.isSafe ? "SAFE" : "NOT SAFE"}` : "Status: —",
                ].join("\n")
              }
              onGoResults={() => smoothScrollTo("combined-results")}
              onGoSteps={() => {
                setDetailsTab("steps");
                smoothScrollTo("combined-details");
              }}
              onReset={() => {
                clearDraft();
                setDesignMethod(combinedDefaults.designMethod);
                setMaterial(combinedDefaults.material as SteelMaterialKey);
                setDeadLoadKft(combinedDefaults.deadLoadKft);
                setLiveLoadKft(combinedDefaults.liveLoadKft);
                setSpanFt(combinedDefaults.spanFt);
                setCbFactor(combinedDefaults.cbFactor);
                setShapeName(combinedDefaults.shapeName);
              }}
            />
          </div>
        </div>

        <ModuleDetailsTabs
          title="Details"
          description="Demand synthesis, recommendations, and selected section steps."
          value={detailsTab}
          onChange={(v) => setDetailsTab(v as "steps" | "demand")}
          tabs={[
            {
              id: "demand",
              label: "Demand & recommendation",
              panel: (
                <Card id="combined-details">
                  <CardHeader title="Workbook demand synthesis" />
                  <CardBody className="space-y-3 text-sm text-[color:var(--foreground)]">
                    {out ? (
                      <>
                        <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] p-3 text-xs text-[color:var(--muted)]">
                          <p>
                            w* = {out.demand.wStrength.toFixed(3)} kip/ft, Mu = {fmtKipFt(out.demand.Mu)}, Vu = {fmtKips(out.demand.Vu)}
                          </p>
                          <p>
                            Service w = {out.demand.wService.toFixed(3)} kip/ft, L = {out.demand.L.toFixed(1)} in, D+w_b ={" "}
                            {out.demand.deadWithSelf.toFixed(3)} kip/ft
                          </p>
                          <p className="mt-1">
                            Workbook equations: LRFD `max(1.4(D+w_b), 1.2(D+w_b)+1.6L)` / ASD `D+L+w_b`; Mu = wL^2/8; Vu = wL/2.
                          </p>
                        </div>
                        {out.recommended ? (
                          <div className="flex items-center gap-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-3">
                            <Badge tone="good">{out.recommended.shapeName}</Badge>
                            <p className="text-[color:var(--muted)]">
                              Lightest SAFE section, weight {out.recommended.weightLbFt.toFixed(1)} lb/ft; governing{" "}
                              {out.recommended.beamLimitStates?.governing ?? out.recommended.governingCase}.
                            </p>
                          </div>
                        ) : (
                          <p className="text-[color:var(--muted)]">No passing section found for the current inputs.</p>
                        )}
                      </>
                    ) : (
                      <p className="text-[color:var(--muted)]">Enter valid inputs.</p>
                    )}
                  </CardBody>
                </Card>
              ),
            },
            {
              id: "steps",
              label: "Selected steps",
              panel: (
                <Card>
                  <CardHeader title="Selected section steps" />
                  <CardBody>{selected ? <StepsTable steps={selected.steps} /> : <p className="text-sm text-[color:var(--muted)]">Enter valid inputs.</p>}</CardBody>
                </Card>
              ),
            },
          ]}
        />
      </div>
    </AppShell>
  );
}

