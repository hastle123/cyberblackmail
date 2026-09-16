import { prisma } from "@/lib/prisma";
import { RETIRED_RSS_URLS } from "./rss-headers";

export const RSS_FEEDS = [
  { name: "BleepingComputer", rssUrl: "https://www.bleepingcomputer.com/feed/" },
  { name: "Threatpost", rssUrl: "https://threatpost.com/feed/" },
  { name: "CISA Alerts", rssUrl: "https://www.cisa.gov/cybersecurity-advisories/all.xml" },
  { name: "Krebs on Security", rssUrl: "https://krebsonsecurity.com/feed/" },
  { name: "Malwarebytes Labs", rssUrl: "https://www.malwarebytes.com/blog/feed/index.xml" },
  { name: "Help Net Security", rssUrl: "https://www.helpnetsecurity.com/feed/" },
] as const;

export async function ensureRssSources(): Promise<number> {
  for (const rssUrl of RETIRED_RSS_URLS) {
    await prisma.source.updateMany({ where: { rssUrl }, data: { active: false } });
  }
  for (const feed of RSS_FEEDS) {
    await prisma.source.upsert({
      where: { rssUrl: feed.rssUrl },
      create: { ...feed, active: true },
      update: { name: feed.name, active: true },
    });
  }
  return prisma.source.count({ where: { active: true } });
}
