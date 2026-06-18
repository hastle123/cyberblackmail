import { config } from "dotenv";
config();

import { ingestRssFeeds } from "../src/lib/ingest/rss";

async function main() {
  console.log("Fetching RSS feeds…");
  const result = await ingestRssFeeds();
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.errors.length > 0 && result.created === 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
