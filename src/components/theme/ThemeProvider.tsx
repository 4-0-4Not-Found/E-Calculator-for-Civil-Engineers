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
  return "light";
}

function resolve(mode: ThemeMode): "light" | "dark" {
  void mode;
  return "light";
}

function applyDom(mode: ThemeMode): "light" | "dark" {
  void mode;
  document.documentElement.classList.remove("dark");
  return "light";
}

export function ThemeProvider(props: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("light");
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

  const setMode = useCallback((m: ThemeMode) => {
    // Theme is intentionally fixed to match product design.
    void m;
    setModeState("light");
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
    const content = resolved === "dark" ? "#f4f7fb" : "#f4f7fb";
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

