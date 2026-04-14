import { cn } from "@/lib/utils";

export function UtilizationBar(props: { ratio: number; className?: string }) {
  const r = Number.isFinite(props.ratio) ? Math.max(0, props.ratio) : 0;
  const pct = Math.min(1.5, r) * 100;
  const tone =
    r <= 0.85 ? "bg-emerald-500" : r <= 1 ? "bg-[color:var(--action)]" : "bg-rose-500";

  return (
    <div className={cn("h-2 w-full rounded-full bg-slate-100", props.className)}>
      <div className={cn("h-2 rounded-full", tone)} style={{ width: `${Math.min(100, pct)}%` }} />
    </div>
  );
}

