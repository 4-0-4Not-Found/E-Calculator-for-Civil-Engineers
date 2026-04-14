import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

const INGEST_URL = "http://127.0.0.1:7464/ingest/ca13048c-9d98-4bcc-a485-2fd46d0652e4" as const;

/** Append one NDJSON line under `.cursor/` at repo root (development only; portable path). */
export async function appendAgentDebugLine(line: unknown): Promise<void> {
  if (process.env.NODE_ENV === "production") return;
  try {
    const logDir = path.join(process.cwd(), ".cursor");
    const logPath = path.join(logDir, "debug-fd44da.log");
    await mkdir(logDir, { recursive: true });
    await appendFile(logPath, `${JSON.stringify(line)}\n`, "utf8");
  } catch {
    /* ignore (read-only FS, sandbox, etc.) */
  }
}

/** Forward JSON to local Cursor ingest (development only). */
export function sendDebugIngest(payload: Record<string, unknown>): void {
  if (process.env.NODE_ENV !== "development") return;
  fetch(INGEST_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "fd44da",
    },
    body: JSON.stringify({ ...payload, sessionId: "fd44da" }),
  }).catch(() => {});
}

/** Same ingest URL but with arbitrary JSON body (already stringified object). */
export function sendDebugIngestBody(body: unknown): void {
  if (process.env.NODE_ENV !== "development") return;
  fetch(INGEST_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "fd44da",
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  }).catch(() => {});
}
