import { NextResponse } from "next/server";
import { appendFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") return NextResponse.json({ ok: true });
  try {
    const body = await req.text();
    const line = body.endsWith("\n") ? body : `${body}\n`;
    const filePath = path.join(process.cwd(), "debug-184fe2.log");
    await appendFile(filePath, line, "utf8");
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

