import { NextResponse } from "next/server";
import { appendFile } from "node:fs/promises";
import { join } from "node:path";
import { cwd } from "node:process";

export const runtime = "nodejs";

async function appendNdjson(line: unknown) {
  if (process.env.NODE_ENV === "production") return;
  try {
    const p = join(cwd(), "debug-a6528a.log");
    await appendFile(p, `${JSON.stringify(line)}\n`, "utf8");
  } catch {
    // ignore
  }
}

async function appendNdjson291aab(line: unknown) {
  if (process.env.NODE_ENV === "production") return;
  try {
    const p = join(cwd(), "debug-291aab.log");
    await appendFile(p, `${JSON.stringify(line)}\n`, "utf8");
  } catch {
    // ignore
  }
}

export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") return NextResponse.json({ ok: true });
  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    body = null;
  }
  await appendNdjson(body);
  if (body && typeof body === "object" && "sessionId" in body && (body as { sessionId?: unknown }).sessionId === "291aab") {
    await appendNdjson291aab(body);
  }
  return NextResponse.json({ ok: true });
}

