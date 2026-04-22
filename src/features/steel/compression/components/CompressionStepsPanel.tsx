import { StepsTable } from "@/components/StepsTable";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { TextInput } from "@/components/ui/Field";
import type { CalculationStep } from "@/lib/types/calculation";
import { useMemo, useState } from "react";

type Props = {
  steps: CalculationStep[];
  governingCase: string;
  controllingStrength: number;
};

export function CompressionStepsPanel(props: Props) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return props.steps;
    return props.steps.filter((s) => {
      const hay = `${s.id} ${s.label} ${s.formula ?? ""} ${s.note ?? ""}`.toLowerCase();
      return hay.includes(query);
    });
  }, [props.steps, q]);

  const pinned = useMemo(() => {
    const g = props.governingCase.trim().toLowerCase();
    if (!g) return null;
    return (
      filtered.find((s) => `${s.id} ${s.label}`.toLowerCase().includes(g)) ??
      props.steps.find((s) => `${s.id} ${s.label}`.toLowerCase().includes(g)) ??
      null
    );
  }, [filtered, props.governingCase, props.steps]);

  return (
    <Card id="compression-steps">
      <CardHeader
        title="Steps"
        description={
          <>
            Governing: <span className="font-semibold text-[color:var(--foreground)]">{props.governingCase}</span> · Capacity{" "}
            <span className="font-semibold tabular-nums text-[color:var(--foreground)]">
              {props.controllingStrength.toFixed(3)} kips
            </span>
          </>
        }
        right={
          <span className="inline-flex items-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3 py-1 text-[11px] font-semibold text-[color:var(--muted)] shadow-sm">
            Show math
          </span>
        }
      />
      <CardBody>
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-1">
            <TextInput value={q} onChange={setQ} placeholder="Search steps (e.g., KL/r, Fcr, φPn)" clearable />
          </div>
          <div className="sm:col-span-1 text-xs font-semibold text-[color:var(--muted)] sm:text-right">
            {q.trim().length ? `Showing ${filtered.length} matches` : "Tip: use “Key steps only” to reduce noise."}
          </div>
        </div>

        {pinned ? (
          <div className="mb-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-3)]/55 px-4 py-3 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--muted)]">Pinned (governing)</p>
            <div className="mt-2 flex flex-col gap-1">
              <p className="font-semibold text-[color:var(--foreground)]">{pinned.label}</p>
              <p className="font-mono text-xs text-[color:var(--muted)]">{pinned.formula ?? "—"}</p>
            </div>
          </div>
        ) : null}

        <StepsTable steps={filtered} governingCase={String(props.governingCase)} tools />
      </CardBody>
    </Card>
  );
}
