import { NextRequest, NextResponse } from "next/server";
import { ingestScamRssFeeds } from "@/lib/ingest/scam-rss";
import { enrichArticles } from "@/lib/ingest/enrich";

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

  const maxCreates = Number(process.env.SCAMS_INGEST_MAX_CREATES ?? "8") || 8;
  const enrichLimit = Number(process.env.SCAMS_ENRICH_LIMIT ?? "5") || 5;

  const ingest = await ingestScamRssFeeds({ skipTranslate: true, maxCreates });
  const enrich = await enrichArticles({ limit: enrichLimit, priorityScams: true });

  return NextResponse.json({
    ok: true,
    type: "scams-ingest",
    finishedAt: new Date().toISOString(),
    ingest,
    enrich,
  });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
