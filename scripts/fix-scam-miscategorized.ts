import dotenv from "dotenv";
import { resolve } from "path";

dotenv.config();
dotenv.config({ path: resolve(process.cwd(), ".env.local"), override: true });

import { isScamArticleContent } from "../src/lib/scams";

async function main() {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  try {
    const scams = await prisma.article.findMany({
      where: { category: "SCAMS" },
      select: { id: true, slug: true, title: true, excerpt: true, source: true },
    });

    let moved = 0;
    for (const a of scams) {
      if (isScamArticleContent(a.title, a.excerpt ?? "")) continue;

      await prisma.article.update({
        where: { id: a.id },
        data: { category: "THREAT_INTEL" },
      });
      console.log(`→ THREAT_INTEL: ${a.slug}`);
      moved++;
    }

    console.log(`\nRecategorized: ${moved} article(s)`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
