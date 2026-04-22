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
import { aiscShapes } from "@/lib/aisc/data";
import { steelMaterialMap, type SteelMaterialKey } from "@/lib/data/materials";
import { fmtKips } from "@/lib/format/display";
import { evaluateShear, shearDefaults, shearDraftSchema } from "@/features/steel/shear/module-config";
import { formatRelativeTime } from "@/lib/format/relativeTime";
import { smoothScrollTo } from "@/features/module-runtime/scroll";
import { Badge } from "@/components/ui/Badge";
import { ModuleDetailsTabs } from "@/components/layout/ModuleDetailsTabs";

export default function ShearPage() {
  const [designMethod, setDesignMethod] = useState<"LRFD" | "ASD">(shearDefaults.designMethod);
  const [material, setMaterial] = useState<SteelMaterialKey>(shearDefaults.material as SteelMaterialKey);
  const [shapeName, setShapeName] = useState(shearDefaults.shapeName);
  const [demandV, setDemandV] = useState(shearDefaults.demandV);

  const { savedAt, saving, clearDraft } = useBrowserDraft({
    storageKey: STORAGE.shear,
    savedAtKey: CLIENT_PERSISTENCE.savedAt("shear"),
    schema: shearDraftSchema,
    hydrate: (p) => {
      if (p.designMethod === "LRFD" || p.designMethod === "ASD") setDesignMethod(p.designMethod);
      if (typeof p.material === "string") setMaterial(p.material as SteelMaterialKey);
      if (typeof p.shapeName === "string") setShapeName(p.shapeName);
      if (typeof p.demandV === "string") setDemandV(p.demandV);
    },
    serialize: () => ({ designMethod, material, shapeName, demandV }),
    watch: [designMethod, material, shapeName, demandV],
  });

  const shapeOptions = useMemo(() => aiscShapes.filter((s) => s.type === "W"), []);
  const shape = useMemo(() => shapeOptions.find((s) => s.shape === shapeName), [shapeOptions, shapeName]);
  const mat = steelMaterialMap[material];
  const out = useMemo(() => {
    if (!shape) return null;
    return evaluateShear({
      designMethod,
      Fy: mat.Fy,
      d: shape.d,
      tw: shape.tw,
      hTw: shape.h_tw,
      demandV: Number(demandV) || 0,
    });
  }, [shape, designMethod, mat, demandV]);

  const ratio = out && out.controllingStrength > 0 ? out.demand / out.controllingStrength : undefined;
  const [detailsTab, setDetailsTab] = useState<"steps" | "section">("steps");

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
          description="Workbook source: PROGRAM-2.xlsx / Shear (ANALYSIS). Uses selected W-shape web depth and thickness with method-specific shear capacity."
          image={{ src: "/assets/shear.png", alt: "Shear module" }}
        />

        <div className="grid gap-8 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-7">
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
                  <Field label="Steel type (Fy)">
                    <SelectInput value={material} onChange={(v) => setMaterial(v as SteelMaterialKey)}>
                      <option value="A36">ASTM A36</option>
                      <option value="A572">ASTM A572 Gr.50</option>
                      <option value="A992">ASTM A992 (W)</option>
                    </SelectInput>
                  </Field>
                  <Field label="W-shape">
                    <SelectInput value={shapeName} onChange={(v) => setShapeName(v)}>
                      {shapeOptions.map((s) => (
                        <option key={s.shape} value={s.shape}>
                          {s.shape}
                        </option>
                      ))}
                    </SelectInput>
                  </Field>
                  <Field label="Shear demand V_u (kips)">
                    <TextInput value={demandV} onChange={setDemandV} />
                  </Field>
                </div>

                {shape ? (
                  <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] p-3 text-xs text-[color:var(--muted)]">
                    d = {shape.d.toFixed(3)} in, t_w = {shape.tw.toFixed(3)} in, h/t_w = {shape.h_tw.toFixed(3)}
                  </div>
                ) : null}
              </CardBody>
            </Card>
          </div>

          <div className="space-y-4 lg:col-span-5 lg:sticky lg:top-28" id="shear-results">
            <ResultHero
              status={!out ? "invalid" : out.isSafe ? "safe" : "unsafe"}
              title={`${designMethod} shear status`}
              governing={out?.governingCase ?? "—"}
              capacityLabel={designMethod === "LRFD" ? "φV_n" : "V_n / Ω"}
              capacity={out ? fmtKips(out.controllingStrength) : "—"}
              demandLabel="V_u demand"
              demand={out ? fmtKips(out.demand) : "—"}
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
              savedKey={CLIENT_PERSISTENCE.savedAt("shear")}
              saving={saving}
              savedAt={savedAt}
              saveSlots={{
                moduleKey: "shear",
                draftStorageKey: STORAGE.shear,
                getCurrent: () => ({ designMethod, material, shapeName, demandV }),
              }}
              copyText={() =>
                [
                  "Shear module",
                  `Method: ${designMethod}`,
                  `Material: ${material}`,
                  `Shape: ${shapeName}`,
                  `Demand V_u: ${demandV || "0"} kips`,
                  out ? `Capacity: ${out.controllingStrength.toFixed(3)} kips` : "Capacity: —",
                  out ? `Status: ${out.isSafe ? "SAFE" : "NOT SAFE"}` : "Status: —",
                ].join("\n")
              }
              onGoResults={() => smoothScrollTo("shear-results")}
              onGoSteps={() => {
                setDetailsTab("steps");
                smoothScrollTo("shear-details");
              }}
              onReset={() => {
                clearDraft();
                setDesignMethod(shearDefaults.designMethod);
                setMaterial(shearDefaults.material as SteelMaterialKey);
                setShapeName(shearDefaults.shapeName);
                setDemandV(shearDefaults.demandV);
              }}
            />
          </div>
        </div>

        <ModuleDetailsTabs
          title="Details"
          description="Review step-by-step computations and selected section properties."
          value={detailsTab}
          onChange={(v) => setDetailsTab(v as "steps" | "section")}
          tabs={[
            {
              id: "steps",
              label: "Steps",
              panel: (
                <Card id="shear-details">
                  <CardHeader title="Computation steps" />
                  <CardBody>{out ? <StepsTable steps={out.steps} /> : <p className="text-sm text-[color:var(--muted)]">Select a shape.</p>}</CardBody>
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
        />
      </div>
    </AppShell>
  );
}

