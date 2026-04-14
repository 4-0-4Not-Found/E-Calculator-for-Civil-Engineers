"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { RouteProgress } from "@/components/navigation/RouteProgress";

export function AppProviders(props: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <RouteProgress />
      {props.children}
    </ThemeProvider>
  );
}
