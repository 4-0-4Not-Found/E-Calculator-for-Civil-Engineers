"use client";

import { useCallback, useRef, useState } from "react";
import { AUTOSAVE_MODULE_KEYS, CLIENT_PERSISTENCE } from "@/lib/client-persistence";
import { STORAGE } from "@/lib/storage/keys";
import { applyBundle, collectBundle } from "@/lib/storage/project-bundle";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export function ProjectBackupPanel() {
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const toast = useToast();
  const isDev = process.env.NODE_ENV === "development";

  const download = useCallback(() => {
    const bundle = collectBundle();
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `spanledger-project-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    // #region agent log (download click)
    if (isDev) {
      fetch('/api/debug184fe2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'184fe2',runId:'pre-fix',hypothesisId:'H1',location:'ProjectBackupPanel.tsx:download',message:'Download invoked',data:{filename:a.download,keys:Object.keys(bundle)},timestamp:Date.now()})}).catch(()=>{});
    }
    // #endregion agent log (download click)
    setMsg("Download started — includes inputs saved from each module you have used.");
    toast.push({ title: "Download started", message: a.download, tone: "info" });
  }, [toast, isDev]);

  const onFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    // #region agent log (upload selected)
    if (isDev) {
      fetch('/api/debug184fe2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'184fe2',runId:'pre-fix',hypothesisId:'H2',location:'ProjectBackupPanel.tsx:onFile',message:'File selected',data:{name:f.name,size:f.size,type:f.type},timestamp:Date.now()})}).catch(()=>{});
    }
    // #endregion agent log (upload selected)
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (applyBundle(data)) {
          // #region agent log (restore success)
          if (isDev) {
            fetch('/api/debug184fe2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'184fe2',runId:'pre-fix',hypothesisId:'H2',location:'ProjectBackupPanel.tsx:onFile',message:'Restore applied',data:{topKeys:data&&typeof data==='object'?Object.keys(data as object).slice(0,20):null},timestamp:Date.now()})}).catch(()=>{});
          }
          // #endregion agent log (restore success)
          setMsg("Loaded — refresh the page or open each module to see values.");
          toast.push({ title: "Loaded", message: "Project restored from JSON.", tone: "good" });
        } else {
          // #region agent log (restore rejected)
          if (isDev) {
            fetch('/api/debug184fe2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'184fe2',runId:'pre-fix',hypothesisId:'H5',location:'ProjectBackupPanel.tsx:onFile',message:'Restore rejected by applyBundle',data:{dataType:data===null?'null':typeof data},timestamp:Date.now()})}).catch(()=>{});
          }
          // #endregion agent log (restore rejected)
          setMsg("Could not read project file.");
          toast.push({ title: "Load failed", message: "Could not read project file.", tone: "bad" });
        }
      } catch {
        // #region agent log (restore parse error)
        if (isDev) {
          fetch('/api/debug184fe2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'184fe2',runId:'pre-fix',hypothesisId:'H5',location:'ProjectBackupPanel.tsx:onFile',message:'Restore failed: JSON.parse error',data:{},timestamp:Date.now()})}).catch(()=>{});
        }
        // #endregion agent log (restore parse error)
        setMsg("Invalid JSON file.");
        toast.push({ title: "Invalid file", message: "That JSON file could not be parsed.", tone: "bad" });
      }
      e.target.value = "";
    };
    reader.readAsText(f);
  }, [toast, isDev]);

  const clearAll = useCallback(() => {
    setConfirmClearOpen(true);
  }, []);

  const doClearAll = useCallback(() => {
    Object.values(STORAGE).forEach((k) => localStorage.removeItem(k));
    AUTOSAVE_MODULE_KEYS.forEach((m) => localStorage.removeItem(CLIENT_PERSISTENCE.savedAt(m)));
    localStorage.removeItem(CLIENT_PERSISTENCE.lastRoute);
    // #region agent log (clear all)
    if (isDev) {
      fetch('/api/debug184fe2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'184fe2',runId:'pre-fix',hypothesisId:'H4',location:'ProjectBackupPanel.tsx:doClearAll',message:'Cleared localStorage keys',data:{removedKeys:{tension:STORAGE.tension,compression:STORAGE.compression,bending:STORAGE.bending,connections:STORAGE.connections},removedTs:AUTOSAVE_MODULE_KEYS.map((m)=>CLIENT_PERSISTENCE.savedAt(m))},timestamp:Date.now()})}).catch(()=>{});
    }
    // #endregion agent log (clear all)
    setMsg("Saved inputs cleared for this browser.");
    toast.push({ title: "Cleared", message: "Saved inputs removed for this browser.", tone: "info" });
  }, [toast, isDev]);

  return (
    <section className="rounded-2xl bg-[color:var(--mint)] p-8 text-sm shadow-[var(--shadow-sm)]">
      <ConfirmDialog
        open={confirmClearOpen}
        contextLabel="localhost:3000"
        title="Clear all saved inputs for this browser?"
        description={
          <p>
            This removes saved fields for every module and cannot be undone.
          </p>
        }
        confirmLabel="OK"
        cancelLabel="Cancel"
        onCancel={() => setConfirmClearOpen(false)}
        onConfirm={() => {
          setConfirmClearOpen(false);
          doClearAll();
        }}
      />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">Project</p>
          <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-[color:var(--accent)]">Save / load</h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[color:var(--accent-weak)] bg-white/70 px-3 py-1 text-[11px] font-semibold text-[color:var(--accent)]">
            JSON backup
          </span>
          <span className="rounded-full border border-[color:var(--accent-weak)] bg-white/70 px-3 py-1 text-[11px] font-semibold text-[color:var(--accent)]">
            Local autosave
          </span>
        </div>
      </div>

      <p className="mt-4 max-w-3xl text-[color:var(--muted)]">
        Each calculator saves its fields to this device as you work. Download one JSON file to back up everything, or load a
        file to restore.
      </p>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-white/60 bg-white/60 p-5 backdrop-blur-[8px]">
          <p className="text-sm font-semibold text-[color:var(--accent)]">Backup</p>
          <p className="mt-1 text-xs text-[color:var(--muted)]">Download a single JSON file containing all saved module inputs.</p>
          <div className="mt-4">
            <Button type="button" variant="primary" size="sm" onClick={download} className="w-full justify-center">
              Download project JSON
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/60 bg-white/60 p-5 backdrop-blur-[8px]">
          <p className="text-sm font-semibold text-[color:var(--accent)]">Restore</p>
          <p className="mt-1 text-xs text-[color:var(--muted)]">Load a previously downloaded JSON file and restore fields.</p>
          <div className="mt-4">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => fileRef.current?.click()}
              className="w-full justify-center"
            >
              Load project JSON
            </Button>
            <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onFile} />
          </div>
        </div>

        <div className="rounded-2xl border border-white/60 bg-white/60 p-5 backdrop-blur-[8px]">
          <p className="text-sm font-semibold text-[color:var(--accent)]">Reset</p>
          <p className="mt-1 text-xs text-[color:var(--muted)]">Clear all saved inputs from this browser (irreversible).</p>
          <div className="mt-4">
            <Button type="button" variant="danger" size="sm" onClick={clearAll} className="w-full justify-center">
              Clear saved inputs
            </Button>
          </div>
        </div>
      </div>

      {msg ? (
        <div className="mt-4 rounded-2xl border border-white/70 bg-white/70 px-4 py-3 text-sm text-[color:var(--muted)]">
          {msg}
        </div>
      ) : null}
    </section>
  );
}
