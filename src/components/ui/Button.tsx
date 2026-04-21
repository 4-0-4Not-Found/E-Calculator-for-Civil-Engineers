import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(props, ref) {
  const variant = props.variant ?? "secondary";
  const size = props.size ?? "md";

  const base =
    [
      "inline-flex items-center justify-center gap-2 whitespace-nowrap",
      "rounded-full font-semibold",
      "transition will-change-transform",
      "focus:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-60",
      "active:translate-y-0",
    ].join(" ");

  const sizes =
    size === "sm"
      ? "min-h-10 px-3.5 py-2 text-sm"
      : "min-h-11 px-5 py-2.5 text-sm md:text-[15px]";

  const variants =
    variant === "primary"
      ? [
          "bg-[color:var(--brand)] text-white",
          "shadow-sm",
          "hover:bg-[color:var(--brand-2)] hover:shadow-[var(--shadow-sm)] hover:-translate-y-0.5",
          "active:translate-y-0 active:shadow-sm",
          "focus-visible:ring-[color:var(--brand)]/20",
        ].join(" ")
      : variant === "danger"
        ? [
            "border border-red-200 bg-[color:var(--surface)] text-red-800",
            "shadow-sm",
            "hover:bg-red-50 hover:-translate-y-0.5",
            "active:translate-y-0",
            "focus-visible:ring-red-500/15",
          ].join(" ")
        : variant === "ghost"
          ? [
              "bg-transparent text-[color:var(--foreground)]",
              "shadow-none",
              "hover:bg-[color:var(--surface-2)] hover:-translate-y-0.5",
              "active:translate-y-0",
              "focus-visible:ring-[color:var(--brand)]/12",
            ].join(" ")
          : [
              "border border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--foreground)]",
              "shadow-sm ring-1 ring-transparent",
              "hover:bg-[color:var(--surface-3)] hover:border-[color:var(--accent-weak)] hover:ring-[color:var(--accent-weak)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)]",
              "active:translate-y-0 active:shadow-sm",
              "focus-visible:ring-[color:var(--brand)]/10",
            ].join(" ");

  const { className, leftIcon, rightIcon, children, ...rest } = props;
  return (
    <button ref={ref} className={cn(base, sizes, variants, className)} {...rest}>
      {leftIcon ? <span className="shrink-0">{leftIcon}</span> : null}
      <span className="min-w-0 truncate">{children}</span>
      {rightIcon ? <span className="shrink-0">{rightIcon}</span> : null}
    </button>
  );
});
