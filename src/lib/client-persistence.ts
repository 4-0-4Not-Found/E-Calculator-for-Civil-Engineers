/**
 * Browser storage keys for this deployment only.
 * Using a unique namespace avoids collisions with other white-label installs in the same browser.
 */
export const CLIENT_PERSISTENCE = {
  theme: "spanledger/v1/ui/color-scheme",
  favorites: "spanledger/v1/home/favorite-hrefs",
  homeModuleOrder: "spanledger/v1/home/module-order",
  lastRoute: "spanledger/v1/nav/last-path",
  recentRoutes: "spanledger/v1/nav/recent-paths",
  uiDetails: (id: string) => `spanledger/v1/ui/panel/${encodeURIComponent(id)}`,
  savedAt: (moduleKey: AutosaveModuleKey) => `spanledger/v1/autosave/ts/${moduleKey}`,
  compareSnapshot: (slug: string) => `spanledger/v1/compare/${slug}`,
  /** CustomEvent name for opening the command palette from other UI. */
  commandPaletteOpen: "spanledger:v1:command-palette:open",
} as const;

export const AUTOSAVE_MODULE_KEYS = ["tension", "compression", "bending", "shear", "combined", "connections"] as const;
export type AutosaveModuleKey = (typeof AUTOSAVE_MODULE_KEYS)[number];
