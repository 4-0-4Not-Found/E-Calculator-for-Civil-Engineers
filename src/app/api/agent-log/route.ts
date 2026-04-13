import { NextResponse } from "next/server";
import { appendFile, mkdir } from "node:fs/promises";
import { URL } from "node:url";

export const runtime = "nodejs";

async function appendLine(line: unknown) {
  try {
    const logDir = "C:\\Users\\Asus\\OneDrive\\Desktop\\Civil-E-Cal\\.cursor";
    const logPath =
      "C:\\Users\\Asus\\OneDrive\\Desktop\\Civil-E-Cal\\.cursor\\debug-fd44da.log";
    await mkdir(logDir, { recursive: true });
    await appendFile(logPath, `${JSON.stringify(line)}\n`, "utf8");
  } catch {
    // ignore
  }
}

export async function GET(req: Request) {
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
    await fetch(
      "http://127.0.0.1:7464/ingest/ca13048c-9d98-4bcc-a485-2fd46d0652e4",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "fd44da",
        },
        body: JSON.stringify({
          sessionId: "fd44da",
          runId: "route",
          hypothesisId: "H10",
          location: "src/app/api/agent-log/route.ts:POST",
          message: "agent-log route hit",
          data: {
            hasBody: body !== null,
            bodyType: body === null ? "null" : typeof body,
            contentType: req.headers.get("content-type"),
          },
          timestamp: Date.now(),
        }),
      },
    ).catch(() => {});
    // #endregion agent log

    // #region agent log
    await fetch(
      "http://127.0.0.1:7464/ingest/ca13048c-9d98-4bcc-a485-2fd46d0652e4",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "fd44da",
        },
        body: JSON.stringify(body),
      },
    );
    // #endregion agent log
  } catch {
    // ignore
  }

  return NextResponse.json({ ok: true });
}

