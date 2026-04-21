import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function InputGroup(props: { children: ReactNode; className?: string }) {
  return <div className={cn("relative", props.className)}>{props.children}</div>;
}

export function InputAdornment(props: { side: "left" | "right"; children: ReactNode }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-y-0 flex items-center text-sm font-semibold text-slate-600",
        props.side === "left" ? "left-3" : "right-3",
      )}
    >
      <span className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-2)] px-2 py-0.5 text-[11px] font-semibold text-[color:var(--muted)]">
        {props.children}
      </span>
    </div>
  );
}

export function TextInputWithUnit(
  props: Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> & {
    value: string;
    onChange: (value: string) => void;
    unit?: string;
    rightLabel?: string;
  },
) {
  const hasRight = Boolean(props.unit || props.rightLabel);
  const { className, value, onChange, unit, rightLabel, ...rest } = props;
  return (
    <InputGroup>
      <input
        {...rest}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full min-h-11 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2.5 text-sm text-slate-950 shadow-sm outline-none placeholder:text-slate-400 focus:border-[color:var(--brand)]/35 focus-visible:ring-4 focus-visible:ring-[color:var(--brand)]/10",
          hasRight ? "pr-16" : undefined,
          className,
        )}
      />
      {unit ? <InputAdornment side="right">{unit}</InputAdornment> : null}
      {!unit && rightLabel ? <InputAdornment side="right">{rightLabel}</InputAdornment> : null}
    </InputGroup>
  );
}

