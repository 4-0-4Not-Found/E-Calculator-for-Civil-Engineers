import { useMemo, useState } from "react";
import { Field, SelectInput, TextInput } from "@/components/ui/Field";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import type { ShapeFamilyKey } from "@/lib/aisc/shape-filters";
import type { SteelMaterial, SteelMaterialKey } from "@/lib/data/materials";
import type { AiscShape } from "@/lib/aisc/types";

type Props = {
  material: SteelMaterialKey;
  onMaterialChange: (v: SteelMaterialKey) => void;
  steelMaterials: SteelMaterial[];
  shapeFamily: ShapeFamilyKey;
  onShapeFamilyChange: (v: ShapeFamilyKey) => void;
  shapeFamilyOptions: { key: ShapeFamilyKey; label: string }[];
  shapeName: string;
  onShapeNameChange: (v: string) => void;
  shapeChoices: AiscShape[];
  mode: "check" | "design";
  onModeChange: (v: "check" | "design") => void;
  designSuggestionShape: string | null;
};

export function CompressionInputsGeneral(props: Props) {
  const [shapeQuery, setShapeQuery] = useState("");

  const filteredShapes = useMemo(() => {
    const q = shapeQuery.trim().toLowerCase();
    if (!q) return props.shapeChoices;
    return props.shapeChoices.filter((s) => s.shape.toLowerCase().includes(q));
  }, [props.shapeChoices, shapeQuery]);

  const shapeOptions = useMemo(() => {
    // Keep current selection visible even when filtered out.
    const selected = filteredShapes.some((s) => s.shape === props.shapeName)
      ? null
      : props.shapeChoices.find((s) => s.shape === props.shapeName) ?? null;
    return selected ? [selected, ...filteredShapes] : filteredShapes;
  }, [filteredShapes, props.shapeChoices, props.shapeName]);

  return (
    <Card id="compression-general">
      <CardHeader
        title="General"
        description="Steel, mode, and shape family. Analysis checks a chosen section; Design auto-picks the lightest safe section."
        right={
          <span className="inline-flex items-center rounded-full border border-[color:var(--accent-weak)] bg-[color:var(--mint)] px-3 py-1 text-[11px] font-semibold text-[color:var(--accent)] shadow-sm">
            Inputs
          </span>
        }
      />
      <CardBody>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Mode" hint="Analysis shows section selection; Design suggests and uses the lightest safe section.">
            <SelectInput value={props.mode} onChange={(v) => props.onModeChange(v as "check" | "design")}>
              <option value="check">Analysis</option>
              <option value="design">Design</option>
            </SelectInput>
          </Field>
          <Field label="Steel Type" hint="Fy (ksi) comes from selection.">
            <SelectInput value={props.material} onChange={(v) => props.onMaterialChange(v as SteelMaterialKey)}>
              {props.steelMaterials.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Shape family" hint="Requires A_g, r_x, r_y > 0 in database.">
            <SelectInput value={props.shapeFamily} onChange={(v) => props.onShapeFamilyChange(v as ShapeFamilyKey)}>
              {props.shapeFamilyOptions.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </SelectInput>
          </Field>
          {props.mode === "check" ? (
            <>
              <Field label="Find shape" hint="Type to filter the list." className="md:col-span-2">
                <TextInput value={shapeQuery} onChange={setShapeQuery} placeholder="e.g., W24X131" clearable />
              </Field>
              <Field
                label="AISC Shape"
                hint={shapeOptions.length === props.shapeChoices.length ? "Filtered v16 shapes." : `Showing ${shapeOptions.length} matches.`}
                className="md:col-span-2"
              >
                <SelectInput value={props.shapeName} onChange={props.onShapeNameChange}>
                  {shapeOptions.map((s) => (
                    <option key={s.shape} value={s.shape}>
                      {s.shape}
                    </option>
                  ))}
                </SelectInput>
              </Field>
            </>
          ) : (
            <Field label="Recommended section" hint="Lightest passing shape (auto-selected)." className="md:col-span-2">
              <div className="rounded-2xl bg-[color:var(--surface-2)] px-3 py-2 text-sm font-semibold ring-1 ring-inset ring-[color:var(--border)]/60">
                {props.designSuggestionShape ?? "No passing section found"}
              </div>
            </Field>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
