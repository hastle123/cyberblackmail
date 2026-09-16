import dotenv from "dotenv";
import { resolve } from "path";

dotenv.config();
dotenv.config({ path: resolve(process.cwd(), ".env.local"), override: true });

import { enrichArticles } from "../src/lib/ingest/enrich";

async function main() {
  const limit = Number(process.env.ENRICH_LIMIT ?? "15") || 15;
  console.log(`Enriching up to ${limit} RSS summaries…`);
  const result = await enrichArticles({ limit });
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.errors.length > 0 && result.enriched === 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
