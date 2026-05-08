import { cn } from "@/lib/utils";

export type CalculatorMode = "check" | "design";

type Props = {
  value: CalculatorMode;
  onChange: (mode: CalculatorMode) => void;
  /**
   * Compact label tells the user which mode means what so the segmented control
   * doubles as documentation, not just a toggle.
   */
  description?: string;
  className?: string;
};

const SEGMENT_BASE =
  "flex-1 rounded-full px-4 py-2 text-sm font-semibold tracking-tight transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand)]/40";
const ACTIVE = "bg-[color:var(--brand)] text-white shadow-sm";
const INACTIVE = "text-[color:var(--muted)] hover:text-[color:var(--foreground)]";

/**
 * Segmented switch dedicated to the Analysis (`check`) ↔ Design (`design`) workflow.
 * Internally we keep using the existing `check`/`design` keys to avoid touching
 * persistence, but the UI shows the user-friendly labels the client asked for.
 */
export function ModeSwitch(props: Props) {
  const { value, onChange, description, className } = props;
  const isCheck = value === "check";
  const activeLabel = isCheck ? "Analysis" : "Design";
  const activeHelp = isCheck
    ? "Enter a known section and verify it against demand."
    : "Provide demand and let the app suggest the lightest passing shape.";

  return (
    <div
      className={cn(
        "rounded-2xl border border-[color:var(--brand)]/25 bg-[color:var(--brand)]/5 p-3",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 pb-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-[color:var(--muted)]">
          Workflow
        </div>
        <div className="rounded-full bg-[color:var(--brand)]/10 px-2.5 py-0.5 text-[11px] font-bold text-[color:var(--brand)]">
          You are in: {activeLabel}
        </div>
      </div>
      <div
        role="tablist"
        aria-label="Calculator mode"
        className="flex gap-1 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-2)] p-1"
      >
        <button
          type="button"
          role="tab"
          aria-selected={isCheck}
          tabIndex={isCheck ? 0 : -1}
          className={cn(SEGMENT_BASE, isCheck ? ACTIVE : INACTIVE)}
          onClick={() => onChange("check")}
        >
          Analysis
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={!isCheck}
          tabIndex={!isCheck ? 0 : -1}
          className={cn(SEGMENT_BASE, !isCheck ? ACTIVE : INACTIVE)}
          onClick={() => onChange("design")}
        >
          Design
        </button>
      </div>
      <p className="mt-2 text-xs text-[color:var(--muted)]">
        <span className="font-semibold text-[color:var(--foreground)]">{activeLabel} mode:</span>{" "}
        {activeHelp}
        {description ? <span className="block opacity-80">{description}</span> : null}
      </p>
    </div>
  );
}
