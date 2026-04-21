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
  const isDev = process.env.NODE_ENV === "development";
  const saveTimer = useRef<number | null>(null);
  const watchToken = JSON.stringify(watch);
  const hydrateEffectCount = useRef(0);
  const lastHydrateRef = useRef<typeof hydrate | null>(null);
  const hydrateRef = useRef(hydrate);
  const saveEffectCount = useRef(0);
  const lastSerializeRef = useRef<typeof serialize | null>(null);
  const serializeRef = useRef(serialize);

  useEffect(() => {
    hydrateRef.current = hydrate;
  }, [hydrate]);

  useEffect(() => {
    serializeRef.current = serialize;
  }, [serialize]);

  useEffect(() => {
    hydrateEffectCount.current += 1;
    const hydrateChanged = lastHydrateRef.current !== null && lastHydrateRef.current !== hydrate;
    lastHydrateRef.current = hydrate;
    // #region agent log (hydrate effect run)
    if (isDev) {
      fetch('/api/debug184fe2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'184fe2',runId:'pre-fix',hypothesisId:'H6',location:'useBrowserDraft.ts:useEffect(hydrate)',message:'Hydrate effect ran',data:{storageKey,hasSchema:Boolean(schema),count:hydrateEffectCount.current,hydrateChanged},timestamp:Date.now()})}).catch(()=>{});
    }
    // #endregion agent log (hydrate effect run)
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
    saveEffectCount.current += 1;
    const serializeChanged = lastSerializeRef.current !== null && lastSerializeRef.current !== serialize;
    lastSerializeRef.current = serialize;
    // #region agent log (save effect run)
    if (isDev) {
      fetch('/api/debug184fe2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'184fe2',runId:'pre-fix',hypothesisId:'H7',location:'useBrowserDraft.ts:useEffect(save)',message:'Save effect ran',data:{storageKey,count:saveEffectCount.current,serializeChanged,watchTokenBytes:watchToken.length},timestamp:Date.now()})}).catch(()=>{});
    }
    // #endregion agent log (save effect run)
    try {
      setSaving(true);
      const payload = serializeRef.current();
      const json = JSON.stringify(payload);
      localStorage.setItem(storageKey, json);
      const ts = Date.now();
      localStorage.setItem(savedAtKey, String(ts));
      setSavedAt(ts);
      // #region agent log (autosave write)
      if (isDev) {
        fetch('/api/debug184fe2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'184fe2',runId:'pre-fix',hypothesisId:'H3',location:'useBrowserDraft.ts:useEffect(save)',message:'Autosave wrote localStorage',data:{storageKey,savedAtKey,bytes:json.length,ts},timestamp:Date.now()})}).catch(()=>{});
      }
      // #endregion agent log (autosave write)
    } catch {
      // #region agent log (autosave error)
      if (isDev) {
        fetch('/api/debug184fe2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'184fe2',runId:'pre-fix',hypothesisId:'H3',location:'useBrowserDraft.ts:useEffect(save)',message:'Autosave failed',data:{storageKey,savedAtKey},timestamp:Date.now()})}).catch(()=>{});
      }
      // #endregion agent log (autosave error)
      /* ignore */
    }
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => setSaving(false), 450);
  }, [hydrated, storageKey, savedAtKey, watchToken, isDev]);

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
