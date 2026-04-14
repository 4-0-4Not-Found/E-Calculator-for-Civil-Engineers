import path from "node:path";
import { appendAgentDebugLine, sendDebugIngest } from "./agent-append-line";

/** Server-only debug logging for RootLayout (keeps Date.now out of component render for ESLint purity). */
export async function runRootLayoutAgentLogs(): Promise<void> {
  const ts = Date.now();
  const logPath = path.join(process.cwd(), ".cursor", "debug-fd44da.log");
  await appendAgentDebugLine({
    sessionId: "fd44da",
    runId: "ssr-file",
    hypothesisId: "H12",
    location: "src/app/layout.tsx:ssr-file",
    message: "RootLayout rendered on server (file)",
    data: { logPath },
    timestamp: ts,
  });

  sendDebugIngest({
    runId: "ssr",
    hypothesisId: "H7",
    location: "src/app/layout.tsx:ssr",
    message: "RootLayout rendered on server",
    data: { hasWindow: typeof window !== "undefined" },
    timestamp: ts,
  });
}
