import type { AiscShape } from "@/lib/aisc/types";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { useMemo } from "react";

type Props = {
  shape: AiscShape;
};

export function CompressionSectionPropertiesPanel(props: Props) {
  const { shape } = props;
  const rx = shape.rx ?? 0;
  const ry = shape.ry ?? 0;
  const axis = rx >= ry ? "x" : "y";
  const ratio = useMemo(() => {
    const max = Math.max(rx, ry, 1e-9);
    return { rx: rx / max, ry: ry / max };
  }, [rx, ry]);
  return (
    <Card id="compression-section">
      <CardHeader
        title="Section properties"
        description="AISC database values for the selected shape."
        right={
          <span className="inline-flex items-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3 py-1 text-[11px] font-semibold text-[color:var(--muted)] shadow-sm">
            r{axis} governs
          </span>
        }
      />
      <CardBody>
        <div className="mb-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-3)]/55 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--muted)]">Radius of gyration</p>
          <div className="mt-3 grid gap-3">
            <AxisBar label="rx" value={rx} unit="in" fill={ratio.rx} />
            <AxisBar label="ry" value={ry} unit="in" fill={ratio.ry} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm text-[color:var(--foreground)]/90">
          <Row label="Shape" value={shape.shape} />
          <Row label="W" value={`${shape.W.toFixed(1)} plf`} />
          <Row label="A_g" value={`${shape.A.toFixed(3)} in²`} />
          <Row label="b_f / 2t_f" value={shape.bf_2tf > 0 ? shape.bf_2tf.toFixed(3) : "—"} />
          <Row label="h / t_w" value={shape.h_tw > 0 ? shape.h_tw.toFixed(3) : "—"} />
          <Row label="rx" value={`${shape.rx.toFixed(3)} in`} />
          <Row label="ry" value={`${shape.ry.toFixed(3)} in`} />
        </div>
      </CardBody>
    </Card>
  );
}

function Row(props: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-[color:var(--muted)]">{props.label}</span>
      <span className="font-semibold tabular-nums text-[color:var(--foreground)]">{props.value}</span>
    </div>
  );
}

function AxisBar(props: { label: string; value: number; unit: string; fill: number }) {
  const pct = `${Math.round(Math.max(0, Math.min(1, props.fill)) * 100)}%`;
  return (
    <div className="grid grid-cols-[48px_1fr_auto] items-center gap-3">
      <span className="text-sm font-semibold text-[color:var(--foreground)]">{props.label}</span>
      <div className="h-2 overflow-hidden rounded-full bg-[color:var(--border)]/35">
        <div className="h-full rounded-full bg-[color:var(--brand)]" style={{ width: pct }} aria-hidden="true" />
      </div>
      <span className="text-sm font-semibold tabular-nums text-[color:var(--foreground)]">
        {Number.isFinite(props.value) ? props.value.toFixed(3) : "—"} {props.unit}
      </span>
    </div>
  );
}
