import { cn } from "@/lib/utils";
import { useId, type ReactNode } from "react";

export function Field(props: {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  return (
    <label className={cn("flex flex-col gap-1.5", props.className)}>
      <span className="text-sm font-semibold text-[color:var(--foreground)]">{props.label}</span>
      {props.hint ? (
        <span id={hintId} className="text-xs leading-relaxed text-[color:var(--muted)]">
          {props.hint}
        </span>
      ) : null}
      {props.children}
      {/* Reserve space so errors don't cause layout jump. */}
      <span
        id={errorId}
        className={cn(
          "min-h-4 text-xs font-semibold leading-4",
          props.error ? "text-rose-700" : "text-transparent",
        )}
        aria-live="polite"
      >
        {props.error ? (
          <span className="inline-flex items-center gap-1">
            <span aria-hidden="true">!</span>
            <span>{props.error}</span>
          </span>
        ) : (
          "—"
        )}
      </span>
    </label>
  );
}

export function TextInput(props: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  clearable?: boolean;
}) {
  const canClear = (props.clearable ?? true) && props.value.length > 0;
  return (
    <div className="relative">
      <input
        className={cn(
          "w-full min-h-11 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2.5 text-sm text-[color:var(--foreground)] shadow-sm outline-none ring-0 placeholder:text-[color:var(--muted)] focus:border-[color:var(--brand)]/35 focus-visible:ring-4 focus-visible:ring-[color:var(--brand)]/10",
          canClear ? "pr-10" : null,
        )}
        value={props.value}
        placeholder={props.placeholder}
        onChange={(e) => props.onChange(e.target.value)}
      />
      {canClear ? (
        <button
          type="button"
          aria-label="Clear field"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-xl px-2 py-1 text-sm font-semibold text-[color:var(--muted)] hover:bg-[color:var(--surface-2)] hover:text-[color:var(--foreground)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--brand)]/10"
          onClick={() => props.onChange("")}
        >
          ×
        </button>
      ) : null}
    </div>
  );
}

export function SelectInput(props: {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <select
      className="w-full min-h-11 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2.5 text-sm font-semibold text-[color:var(--foreground)] shadow-sm outline-none focus:border-[color:var(--brand)]/35 focus-visible:ring-4 focus-visible:ring-[color:var(--brand)]/10"
      value={props.value}
      onChange={(e) => props.onChange(e.target.value)}
    >
      {props.children}
    </select>
  );
}

