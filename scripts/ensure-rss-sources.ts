import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { ensureRssSources } from "../src/lib/ingest/sources";

async function main() {
  const count = await ensureRssSources();
  console.log(`RSS sources ready: ${count}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
