import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, SelectInput, TextInput } from "@/components/ui/Field";
import { TextInputWithUnit } from "@/components/ui/InputGroup";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";

type Props = {
  designMethod: "LRFD" | "ASD";
  onDesignMethodChange: (v: "LRFD" | "ASD") => void;
  Pu: string;
  onPuChange: (v: string) => void;
  L: string;
  onLChange: (v: string) => void;
  k: string;
  onKChange: (v: string) => void;
  builtUpFactor: string;
  onBuiltUpFactorChange: (v: string) => void;
  kEffective: number;
  invalidPu: boolean;
  invalidL: boolean;
  onPresetK: () => void;
  onPresetBuiltUp: () => void;
};

export function CompressionInputsMember(props: Props) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <Card id="compression-member">
      <CardHeader
        title="Member"
        description="Design method, demand, length, and K (units: kips, in)."
        right={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button variant="secondary" size="sm" type="button" onClick={props.onPresetK}>
              K = 1.0
            </Button>
            <Button variant="secondary" size="sm" type="button" onClick={props.onPresetBuiltUp}>
              Built-up = 1.0
            </Button>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              aria-expanded={showAdvanced ? "true" : "false"}
            >
              {showAdvanced ? "Hide advanced" : "Advanced"}
            </Button>
          </div>
        }
      />
      <CardBody>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Design method" hint="LRFD default; ASD uses P_n/1.67 for member buckling.">
            <SelectInput value={props.designMethod} onChange={(v) => props.onDesignMethodChange(v as "LRFD" | "ASD")}>
              <option value="LRFD">LRFD</option>
              <option value="ASD">ASD</option>
            </SelectInput>
          </Field>
          <div id="field-pu">
            <Field
              label="Demand Pu / Pa"
              hint="Required compressive strength (kips)."
              error={props.invalidPu ? "Enter a number ≥ 0." : undefined}
            >
            <div className="rounded-2xl bg-[color:var(--brand)]/5 p-3 ring-1 ring-inset ring-[color:var(--brand)]/20 sm:p-4">
              <TextInputWithUnit
                value={props.Pu}
                onChange={props.onPuChange}
                unit="kips"
                inputMode="decimal"
                className={
                  props.invalidPu ? "border-rose-300 focus:border-rose-400 focus:ring-rose-500/10" : undefined
                }
              />
            </div>
            </Field>
          </div>
          <div id="field-l">
            <Field label="Length L" hint="in" error={props.invalidL ? "Enter a number ≥ 0." : undefined}>
            <TextInputWithUnit
              value={props.L}
              onChange={props.onLChange}
              unit="in"
              inputMode="decimal"
              className={
                props.invalidL ? "border-rose-300 focus:border-rose-400 focus:ring-rose-500/10" : undefined
              }
            />
            </Field>
          </div>
          <div id="field-k">
            <Field label="K-factor" hint="End condition factor from alignment chart.">
            <SelectInput value={props.k} onChange={props.onKChange}>
              {["0.5", "0.65", "0.8", "1.0", "2.0"].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </SelectInput>
            </Field>
          </div>
          {showAdvanced ? (
            <div id="field-builtup" className="md:col-span-2">
              <Field
                label="Factor on K (built-up / notes)"
                hint="Multiply K when your course or lacing notes require it (1.0 = unchanged)."
              >
                <TextInput
                  value={props.builtUpFactor}
                  onChange={props.onBuiltUpFactorChange}
                  placeholder="1.0"
                />
              </Field>
            </div>
          ) : null}
          <p className="md:col-span-2 text-xs font-semibold text-[color:var(--muted)]">
            Effective K = {props.k} × {props.builtUpFactor} ={" "}
            <span className="tabular-nums text-[color:var(--foreground)]">{props.kEffective.toFixed(4)}</span>
          </p>
        </div>
      </CardBody>
    </Card>
  );
}
