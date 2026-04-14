import { describe, it, expect, beforeEach } from "vitest";
import { applyBundle } from "./project-bundle";
import { STORAGE } from "./keys";

function createMemoryLocalStorage() {
  const store: Record<string, string> = {};
  return {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
    removeItem: (k: string) => {
      delete store[k];
    },
    clear: () => {
      for (const k of Object.keys(store)) delete store[k];
    },
  };
}

describe("applyBundle", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, "localStorage", {
      value: createMemoryLocalStorage(),
      configurable: true,
    });
  });

  it("returns false for empty object (no module payloads)", () => {
    expect(applyBundle({})).toBe(false);
  });

  it("returns false when only metadata keys are present", () => {
    expect(applyBundle({ version: 1, exportedAt: "2020-01-01" })).toBe(false);
  });

  it("writes tension and returns true", () => {
    const payload = { foo: 1 };
    expect(applyBundle({ tension: payload })).toBe(true);
    expect(localStorage.getItem(STORAGE.tension)).toBe(JSON.stringify(payload));
  });
});
