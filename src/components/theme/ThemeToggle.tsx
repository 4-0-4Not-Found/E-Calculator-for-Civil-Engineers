"use client";

import { UI } from "@/lib/ui/strings";
import { useTheme, type ThemeMode } from "./ThemeProvider";

export function ThemeToggle() {
  const { mode, setMode } = useTheme();

  const cycle = () => {
    const order: ThemeMode[] = ["system", "light", "dark"];
    const i = order.indexOf(mode);
    setMode(order[(i + 1) % order.length]!);
  };

  const label =
    mode === "light" ? UI.themeLight : mode === "dark" ? UI.themeDark : UI.themeSystem;
  const glyph = mode === "light" ? "☀" : mode === "dark" ? "☾" : "◐";

  return (
    <button
      type="button"
      onClick={cycle}
      title={label}
      aria-label={label}
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-base text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#0818A8]/15 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
    >
      <span aria-hidden="true">{glyph}</span>
    </button>
  );
}
