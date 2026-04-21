import { STORAGE } from "@/lib/storage/keys";

const isDev = process.env.NODE_ENV === "development";

function safeJsonParse(raw: string | null): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Single-file backup of all module inputs (same shape as download JSON). */
export function collectBundle() {
  const tensionRaw = typeof window !== "undefined" ? localStorage.getItem(STORAGE.tension) : null;
  const compressionRaw = typeof window !== "undefined" ? localStorage.getItem(STORAGE.compression) : null;
  const bendingRaw = typeof window !== "undefined" ? localStorage.getItem(STORAGE.bending) : null;
  const connectionsRaw = typeof window !== "undefined" ? localStorage.getItem(STORAGE.connections) : null;

  const out = {
    version: 1 as const,
    exportedAt: new Date().toISOString(),
    tension: safeJsonParse(tensionRaw),
    compression: safeJsonParse(compressionRaw),
    bending: safeJsonParse(bendingRaw),
    connections: safeJsonParse(connectionsRaw),
  };

  // #region agent log (bundle export)
  if (isDev) {
    fetch('/api/debug184fe2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'184fe2',runId:'pre-fix',hypothesisId:'H1',location:'project-bundle.ts:collectBundle',message:'Collected bundle from localStorage',data:{hasWindow:typeof window!=='undefined',rawBytes:{tension:tensionRaw?.length??0,compression:compressionRaw?.length??0,bending:bendingRaw?.length??0,connections:connectionsRaw?.length??0},parsedTypes:{tension:out.tension===null?'null':typeof out.tension,compression:out.compression===null?'null':typeof out.compression,bending:out.bending===null?'null':typeof out.bending,connections:out.connections===null?'null':typeof out.connections}},timestamp:Date.now()})}).catch(()=>{});
  }
  // #endregion agent log (bundle export)

  return out;
}

export function applyBundle(data: unknown) {
  if (!data || typeof data !== "object") return false;
  const o = data as Record<string, unknown>;
  let wrote = false;
  const wroteKeys: string[] = [];
  const rejected: Record<string, string> = {};
  if (typeof o.tension === "object" && o.tension !== null) {
    localStorage.setItem(STORAGE.tension, JSON.stringify(o.tension));
    wrote = true;
    wroteKeys.push("tension");
  } else if ("tension" in o) {
    rejected.tension = typeof o.tension;
  }
  if (typeof o.compression === "object" && o.compression !== null) {
    localStorage.setItem(STORAGE.compression, JSON.stringify(o.compression));
    wrote = true;
    wroteKeys.push("compression");
  } else if ("compression" in o) {
    rejected.compression = typeof o.compression;
  }
  if (typeof o.bending === "object" && o.bending !== null) {
    localStorage.setItem(STORAGE.bending, JSON.stringify(o.bending));
    wrote = true;
    wroteKeys.push("bending");
  } else if ("bending" in o) {
    rejected.bending = typeof o.bending;
  }
  if (typeof o.connections === "object" && o.connections !== null) {
    localStorage.setItem(STORAGE.connections, JSON.stringify(o.connections));
    wrote = true;
    wroteKeys.push("connections");
  } else if ("connections" in o) {
    rejected.connections = typeof o.connections;
  }

  // #region agent log (bundle restore)
  if (isDev) {
    fetch('/api/debug184fe2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'184fe2',runId:'pre-fix',hypothesisId:'H5',location:'project-bundle.ts:applyBundle',message:'Applied bundle into localStorage',data:{topLevelKeys:Object.keys(o).slice(0,20),wrote,wroteKeys,rejected},timestamp:Date.now()})}).catch(()=>{});
  }
  // #endregion agent log (bundle restore)

  return wrote;
}
