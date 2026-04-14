import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  if (process.env.NODE_ENV === "production") return new NextResponse(null, { status: 404 });
  return NextResponse.json({
    cwd: process.cwd(),
    pid: process.pid,
    node: process.version,
    env: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT ?? null,
    },
  });
}

