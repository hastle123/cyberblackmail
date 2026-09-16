import { NextRequest, NextResponse } from "next/server";
import { ingestRssFeeds } from "@/lib/ingest/rss";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorize(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;

  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;

  return request.nextUrl.searchParams.get("secret") === secret;
}

export async function GET(request: NextRequest) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const maxCreates = Number(process.env.INGEST_MAX_CREATES ?? "10") || 10;
  const result = await ingestRssFeeds({
    skipTranslate: true,
    maxCreates,
  });
  return NextResponse.json({ ok: true, finishedAt: new Date().toISOString(), ...result });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
