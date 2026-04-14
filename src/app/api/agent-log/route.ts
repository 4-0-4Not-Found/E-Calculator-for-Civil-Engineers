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
  // #region agent log
  const url = new URL(req.url);
  const runId = url.searchParams.get("runId") ?? "get";
  const message = url.searchParams.get("message") ?? "agent-log GET hit";
  const location = url.searchParams.get("location") ?? "src/app/api/agent-log/route.ts:GET";

  await appendLine({
    sessionId: "fd44da",
    runId,
    hypothesisId: "H11",
    location,
    message,
    data: {
      ua: req.headers.get("user-agent"),
      referer: req.headers.get("referer"),
    },
    timestamp: Date.now(),
  });
  // #endregion agent log

  return new NextResponse(null, { status: 204 });
}

export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") return NextResponse.json({ ok: true });
  try {
    let body: unknown = null;
    try {
      body = await req.json();
    } catch {
      body = null;
    }

    // #region agent log
    await appendLine({
      sessionId: "fd44da",
      runId: "route",
      hypothesisId: "H10",
      location: "src/app/api/agent-log/route.ts:appendFile",
      message: "agent-log route hit (file)",
      data: {
        hasBody: body !== null,
        bodyType: body === null ? "null" : typeof body,
        contentType: req.headers.get("content-type"),
      },
      timestamp: Date.now(),
    });
    // #endregion agent log

    // #region agent log
    // NOTE: local Cursor ingest forwarding intentionally disabled for deploy safety.
    // #endregion agent log

    // #region agent log
    // NOTE: local Cursor ingest forwarding intentionally disabled for deploy safety.
    // #endregion agent log
  } catch {
    // ignore
  }

  return NextResponse.json({ ok: true });
}

