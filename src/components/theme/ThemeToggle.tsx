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
      className="inline-flex min-h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#2d4a3e]/15 bg-[#f0f9f4] text-base text-[#2d4a3e] shadow-sm transition hover:bg-[#e7f4ee] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2d4a3e]/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
    >
      <span aria-hidden="true">{glyph}</span>
    </button>
  );
}
