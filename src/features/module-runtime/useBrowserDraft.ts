"use client";

import { useEffect, useRef, useState, type DependencyList } from "react";
import type { z } from "zod";

type UseBrowserDraftOptions<TPayload> = {
  storageKey: string;
  savedAtKey: string;
  schema?: z.ZodType<Record<string, unknown>>;
  hydrate: (parsed: Record<string, unknown>) => void;
  serialize: () => TPayload;
  watch: DependencyList;
};

export function useBrowserDraft<TPayload>(opts: UseBrowserDraftOptions<TPayload>) {
  const { storageKey, savedAtKey, schema, hydrate, serialize, watch } = opts;
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const saveTimer = useRef<number | null>(null);
  const watchToken = JSON.stringify(watch);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const baseParsed = JSON.parse(raw) as Record<string, unknown>;
        const parsed = schema ? schema.parse(baseParsed) : baseParsed;
        queueMicrotask(() => hydrate(parsed));
      }
    } catch {
      /* ignore bad JSON / storage errors */
    }
    queueMicrotask(() => setHydrated(true));
  }, [hydrate, schema, storageKey]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      setSaving(true);
      const payload = serialize();
      localStorage.setItem(storageKey, JSON.stringify(payload));
      const ts = Date.now();
      localStorage.setItem(savedAtKey, String(ts));
      setSavedAt(ts);
    } catch {
      /* ignore */
    }
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => setSaving(false), 450);
  }, [hydrated, storageKey, savedAtKey, serialize, watchToken]);

  const clearDraft = () => {
    try {
      localStorage.removeItem(storageKey);
      localStorage.removeItem(savedAtKey);
    } catch {
      /* ignore */
    }
  };

  return { hydrated, saving, savedAt, clearDraft };
}
