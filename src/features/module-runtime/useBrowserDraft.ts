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

/**
 * Hydrates form state from `localStorage` on mount and autosaves on changes.
 * - Reads `storageKey` once into `hydrate` then sets `hydrated=true`.
 * - On any change in `watch`, writes the serialized payload back and stamps `savedAtKey`.
 */
export function useBrowserDraft<TPayload>(opts: UseBrowserDraftOptions<TPayload>) {
  const { storageKey, savedAtKey, schema, hydrate, serialize, watch } = opts;
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const saveTimer = useRef<number | null>(null);
  const watchToken = JSON.stringify(watch);
  const hydrateRef = useRef(hydrate);
  const serializeRef = useRef(serialize);

  useEffect(() => {
    hydrateRef.current = hydrate;
  }, [hydrate]);

  useEffect(() => {
    serializeRef.current = serialize;
  }, [serialize]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const baseParsed = JSON.parse(raw) as Record<string, unknown>;
        const parsed = schema ? schema.parse(baseParsed) : baseParsed;
        queueMicrotask(() => hydrateRef.current(parsed));
      }
    } catch {
      /* ignore bad JSON / storage errors */
    }
    queueMicrotask(() => setHydrated(true));
  }, [schema, storageKey]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      setSaving(true);
      const payload = serializeRef.current();
      const json = JSON.stringify(payload);
      localStorage.setItem(storageKey, json);
      const ts = Date.now();
      localStorage.setItem(savedAtKey, String(ts));
      setSavedAt(ts);
    } catch {
      /* ignore */
    }
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => setSaving(false), 450);
  }, [hydrated, storageKey, savedAtKey, watchToken]);

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
