import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Card(props: { className?: string; children: ReactNode }) {
  return <section className={cn("rounded-2xl border border-slate-200 bg-white shadow-sm", props.className)}>{props.children}</section>;
}

export function CardHeader(props: { className?: string; title: ReactNode; description?: ReactNode; right?: ReactNode }) {
  return (
    <div className={cn("flex items-start justify-between gap-4 border-b border-slate-100 p-6", props.className)}>
      <div className="min-w-0">
        <h1 className="text-xl font-extrabold tracking-tight text-slate-950 md:text-2xl">{props.title}</h1>
        {props.description ? <p className="mt-2 text-sm text-slate-700 md:text-base">{props.description}</p> : null}
      </div>
      {props.right ? <div className="shrink-0">{props.right}</div> : null}
    </div>
  );
}

export function CardBody(props: { className?: string; children: ReactNode }) {
  return <div className={cn("p-6", props.className)}>{props.children}</div>;
}
