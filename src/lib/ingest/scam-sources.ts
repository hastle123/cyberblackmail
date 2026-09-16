import { prisma } from "@/lib/prisma";
import { RETIRED_RSS_URLS } from "./rss-headers";

/** Fraud-focused RSS feeds for /api/cron/scams-ingest */
export const SCAM_RSS_FEEDS = [
  { name: "Krebs on Security", rssUrl: "https://krebsonsecurity.com/feed/", fraudOnly: false },
  { name: "BleepingComputer", rssUrl: "https://www.bleepingcomputer.com/feed/", fraudOnly: false },
  { name: "Malwarebytes Labs", rssUrl: "https://www.malwarebytes.com/blog/feed/index.xml", fraudOnly: false },
  { name: "FTC Consumer", rssUrl: "https://www.consumer.ftc.gov/blog/gd-rss.xml", fraudOnly: true },
  { name: "Threatpost", rssUrl: "https://threatpost.com/feed/", fraudOnly: false },
] as const;

export async function ensureScamRssSources(): Promise<number> {
  for (const rssUrl of RETIRED_RSS_URLS) {
    await prisma.source.updateMany({ where: { rssUrl }, data: { active: false } });
  }
  for (const feed of SCAM_RSS_FEEDS) {
    await prisma.source.upsert({
      where: { rssUrl: feed.rssUrl },
      create: { name: `[Scams] ${feed.name}`, rssUrl: feed.rssUrl, active: true },
      update: { name: `[Scams] ${feed.name}`, active: true },
    });
  }
  return SCAM_RSS_FEEDS.length;
}
