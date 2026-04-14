import { NextResponse } from "next/server";
import { appendFile, mkdir } from "node:fs/promises";
import { URL } from "node:url";
import { join } from "node:path";
import { cwd } from "node:process";

export const runtime = "nodejs";

async function appendLine(line: unknown) {
  if (process.env.NODE_ENV === "production") return;
  try {
    const logDir = join(cwd(), ".cursor");
    const logPath = join(logDir, "debug-fd44da.log");
    await mkdir(logDir, { recursive: true });
    await appendFile(logPath, `${JSON.stringify(line)}\n`, "utf8");
  } catch {
    // ignore
  }
}

export async function GET(req: Request) {
  if (process.env.NODE_ENV === "production") return new NextResponse(null, { status: 204 });
  const url = new URL(req.url);
  const runId = url.searchParams.get("runId") ?? "beacon";
  const location =
    url.searchParams.get("location") ?? "src/app/api/agent-beacon/route.ts:GET";

  // #region agent log
  await appendLine({
    sessionId: "fd44da",
    runId,
    hypothesisId: "H15",
    location,
    message: "agent-beacon requested",
    data: {
      ua: req.headers.get("user-agent"),
      referer: req.headers.get("referer"),
    },
    timestamp: Date.now(),
  });
  // #endregion agent log

  return new NextResponse("/* agent beacon */", {
    status: 200,
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

