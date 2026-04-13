import type { ReactNode } from "react";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { UtilizationBar } from "@/components/ui/UtilizationBar";

type Props = {
  status: "safe" | "unsafe" | "invalid";
  title?: string;
  governing?: ReactNode;
  capacityLabel: string;
  capacity: ReactNode;
  demandLabel: string;
  demand: ReactNode;
  utilization?: number;
  metaRight?: ReactNode;
  actions?: ReactNode;
};

export function ResultHero(props: Props) {
  const badge =
    props.status === "invalid"
      ? { tone: "bad" as const, label: "INVALID" }
      : props.status === "safe"
        ? { tone: "good" as const, label: "SAFE" }
        : { tone: "bad" as const, label: "NOT SAFE" };

  return (
    <Card className="border-slate-200">
      <CardBody>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {props.title ?? "Status"}
            </p>
            <div className="mt-2">
              <Badge tone={badge.tone}>{badge.label}</Badge>
            </div>
          </div>
          {props.metaRight ? <div className="shrink-0">{props.metaRight}</div> : null}
        </div>

        <div className="mt-4 grid gap-2 text-sm">
          {props.governing ? (
            <Row label="Governing" value={<span className="font-semibold text-slate-950">{props.governing}</span>} />
          ) : null}
          <Row
            label={props.capacityLabel}
            value={<span className="font-semibold tabular-nums text-slate-950">{props.capacity}</span>}
          />
          <Row
            label={props.demandLabel}
            value={<span className="font-semibold tabular-nums text-slate-950">{props.demand}</span>}
          />
          {props.utilization != null ? (
            <div className="mt-2">
              <div className="mb-1 flex items-baseline justify-between gap-2 text-xs font-semibold text-slate-600">
                <span>Utilization</span>
                <span className="tabular-nums text-slate-800">
                  {(props.utilization * 100).toFixed(1)}%
                </span>
              </div>
              <UtilizationBar ratio={props.utilization} />
            </div>
          ) : null}
        </div>

        {props.actions ? <div className="mt-4 flex flex-wrap gap-2">{props.actions}</div> : null}
      </CardBody>
    </Card>
  );
}

function Row(props: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-slate-600">{props.label}</span>
      <span className="text-right">{props.value}</span>
    </div>
  );
}

