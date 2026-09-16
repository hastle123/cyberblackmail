import Parser from "rss-parser";
import { RSS_PARSER_HEADERS } from "../src/lib/ingest/rss-headers";
import { RSS_FEEDS } from "../src/lib/ingest/sources";
import { SCAM_RSS_FEEDS } from "../src/lib/ingest/scam-sources";

const FEEDS = [
  ...RSS_FEEDS.map((f) => f.rssUrl),
  ...SCAM_RSS_FEEDS.map((f) => f.rssUrl),
];

const parser = new Parser({
  timeout: 15_000,
  headers: RSS_PARSER_HEADERS,
});

async function main() {
  for (const url of FEEDS) {
    const feed = await parser.parseURL(url);
    console.log(`\n=== ${feed.title ?? url} ===`);
    for (const item of (feed.items ?? []).slice(0, 3)) {
      console.log(item.isoDate ?? "no-date", "|", item.title?.slice(0, 75));
    }
  }
}

main().catch(console.error);
