import "dotenv/config";
import { ingestScamRssFeeds } from "../src/lib/ingest/scam-rss";

async function main() {
  const result = await ingestScamRssFeeds({ skipTranslate: true, maxCreates: 15 });
  console.log(JSON.stringify(result, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
