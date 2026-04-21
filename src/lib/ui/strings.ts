import { PRODUCT_BRAND } from "@/lib/brand";

/** UI copy only — does not affect calculation logic. */
export const UI = {
  appTitle: PRODUCT_BRAND.name,
  tagline: PRODUCT_BRAND.tagline,
  skipToContent: "Skip to content",
  themeLight: "Light theme",
  themeDark: "Dark theme",
  themeSystem: "Match system",
  routeLoading: "Loading page…",
  installApp: "Install app",
  reportToc: "Jump to section",
  pageOnThisPage: "On this page",
  /** Command palette footer — keep accurate with CommandPalette key handlers. */
  commandPaletteKeyboardTitle: "Keyboard",
  resumeHint: "Pick up where you left off",
  workspaceLoading: "Loading your workspace…",
} as const;

export const BREADCRUMB_LABELS: Record<string, string> = {
  "/": "Home",
  "/tension": "Tension",
  "/compression": "Compression",
  "/bending-shear": "Beam",
  "/connections": "Connections",
  "/report": "Report",
  "/info": "Info",
  "/offline": "Offline",
  "/workspace": "Workspace",
  "/scope": "Scope",
};
