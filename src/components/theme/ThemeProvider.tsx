"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { CLIENT_PERSISTENCE } from "@/lib/client-persistence";

export type ThemeMode = "light" | "dark" | "system";

const STORAGE_KEY = CLIENT_PERSISTENCE.theme;

type Ctx = {
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  resolved: "light" | "dark";
};

const ThemeContext = createContext<Ctx | null>(null);

function readStored(): ThemeMode {
  if (typeof window === "undefined") return "system";
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    /* ignore */
  }
  return "system";
}

function resolve(mode: ThemeMode): "light" | "dark" {
  if (mode === "light") return "light";
  if (mode === "dark") return "dark";
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyDom(mode: ThemeMode): "light" | "dark" {
  const r = resolve(mode);
  document.documentElement.classList.toggle("dark", r === "dark");
  return r;
}

export function ThemeProvider(props: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [resolved, setResolved] = useState<"light" | "dark">("light");

  useEffect(() => {
    queueMicrotask(() => setModeState(readStored()));
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      const r = applyDom(mode);
      setResolved(r);
      try {
        localStorage.setItem(STORAGE_KEY, mode);
      } catch {
        /* ignore */
      }
    });
  }, [mode]);

  /** When following system, react to OS light/dark changes and keep `html.dark` in sync. */
  useEffect(() => {
    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      queueMicrotask(() => {
        const r = applyDom("system");
        setResolved(r);
      });
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [mode]);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
  }, []);

  const value = useMemo(() => ({ mode, setMode, resolved }), [mode, setMode, resolved]);

  return (
    <ThemeContext.Provider value={value}>
      <ThemeColorMetaBridge />
      {props.children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const v = useContext(ThemeContext);
  if (!v) throw new Error("useTheme must be used within ThemeProvider");
  return v;
}

/** Updates `<meta name="theme-color">` for browser chrome / PWA (must sit inside provider). */
function ThemeColorMetaBridge() {
  const { resolved } = useContext(ThemeContext)!;
  useEffect(() => {
    const content = resolved === "dark" ? "#0f172a" : "#ffffff";
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "theme-color");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", content);
  }, [resolved]);
  return null;
}

