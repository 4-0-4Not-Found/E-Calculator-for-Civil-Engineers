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
    <Card className="border-[color:var(--accent-weak)] bg-[color:var(--mint)] shadow-[var(--shadow-sm)]">
      <CardBody>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--muted)]">
              {props.title ?? "Status"}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge tone={badge.tone}>{badge.label}</Badge>
              {props.utilization != null ? (
                <span className="inline-flex items-baseline gap-1 rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-2.5 py-1 text-xs font-semibold tabular-nums text-[color:var(--foreground)]/80">
                  <span className="text-[11px] font-semibold text-[color:var(--muted)]">Util.</span>
                  <span className="text-sm font-extrabold text-[color:var(--foreground)]">{(props.utilization * 100).toFixed(1)}%</span>
                </span>
              ) : null}
            </div>
            {props.governing ? (
              <p className="mt-2 break-words text-xs font-semibold text-[color:var(--muted)] sm:truncate">
                Governing: <span className="text-[color:var(--foreground)]">{props.governing}</span>
              </p>
            ) : null}
          </div>
          {props.metaRight ? <div className="shrink-0">{props.metaRight}</div> : null}
        </div>

        {/* Key outputs (always visible; reduces need to expand details). */}
        <div className="mt-4 grid gap-2 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3 text-sm shadow-sm">
          <Row
            label={props.capacityLabel}
            value={<span className="font-semibold tabular-nums text-[color:var(--foreground)]">{props.capacity}</span>}
          />
          <Row
            label={props.demandLabel}
            value={<span className="font-semibold tabular-nums text-[color:var(--foreground)]">{props.demand}</span>}
          />
          {props.utilization != null ? (
            <div className="mt-2">
              <div className="mb-1 flex items-baseline justify-between gap-2 text-xs font-semibold text-[color:var(--muted)]">
                <span>Utilization</span>
                <span className="tabular-nums text-[color:var(--foreground)]/80">{(props.utilization * 100).toFixed(1)}%</span>
              </div>
              <UtilizationBar ratio={props.utilization} />
            </div>
          ) : null}
        </div>

        <details className="mt-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)]/65 open:bg-[color:var(--surface)]">
          <summary className="min-h-11 cursor-pointer list-none px-4 py-3 text-sm font-semibold text-[color:var(--foreground)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--brand)]/10 [&::-webkit-details-marker]:hidden">
            Capacity & demand details
            <span className="ml-2 text-xs font-medium text-[color:var(--muted)]">(toggle)</span>
          </summary>
          <div className="border-t border-[color:var(--border)]/35 px-4 py-4">
            <div className="grid gap-2 text-sm">
              {props.utilization != null ? (
                <div className="mt-2">
                  <div className="mb-1 flex items-baseline justify-between gap-2 text-xs font-semibold text-[color:var(--muted)]">
                    <span>Utilization</span>
                    <span className="tabular-nums text-[color:var(--foreground)]/80">
                      {(props.utilization * 100).toFixed(1)}%
                    </span>
                  </div>
                  <UtilizationBar ratio={props.utilization} />
                </div>
              ) : null}
            </div>
          </div>
        </details>

        {props.actions ? <div className="mt-4 flex flex-wrap gap-2">{props.actions}</div> : null}
      </CardBody>
    </Card>
  );
}

function Row(props: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="min-w-0 text-[color:var(--muted)]">{props.label}</span>
      <span className="min-w-0 text-right break-words">{props.value}</span>
    </div>
  );
}

