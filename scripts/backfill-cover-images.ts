import dotenv from "dotenv";
import { resolve } from "path";

dotenv.config();
dotenv.config({ path: resolve(process.cwd(), ".env.local"), override: true });

import { getCategoryCoverFallback, getScamCoverForSlug, isGenericScamCover, isUsableCoverImage } from "../src/lib/article-cover";
import { enrichCoverImageById } from "../src/lib/ingest/enrich-article";

const COVER_LIMIT = Number(process.env.COVER_LIMIT ?? "200");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  try {
    const bad = await prisma.article.findMany({
      where: { coverImage: { not: null } },
      select: { id: true, slug: true, coverImage: true, category: true },
    });

    let fixedBad = 0;
    for (const article of bad) {
      const url = article.coverImage?.trim() ?? "";
      if (!url) continue;
      if (isUsableCoverImage(url) && !(article.category === "SCAMS" && isGenericScamCover(url))) continue;
      await prisma.article.update({
        where: { id: article.id },
        data: {
          coverImage:
            article.category === "SCAMS"
              ? getScamCoverForSlug(article.slug)
              : null,
        },
      });
      fixedBad++;
      console.log(`Cleared bad/generic cover: ${article.slug}`);
    }
    console.log(`Bad covers cleared: ${fixedBad}`);

    const articles = await prisma.article.findMany({
      where: { OR: [{ coverImage: null }, { coverImage: "" }] },
      orderBy: { publishedAt: "desc" },
      take: COVER_LIMIT,
      select: { id: true, slug: true, category: true },
    });

    console.log(`Backfill covers for ${articles.length} article(s)…`);
    let fromUrl = 0;
    let fallback = 0;

    for (const article of articles) {
      process.stdout.write(`${article.slug}… `);
      const r = await enrichCoverImageById(article.id);
      if (r.status === "enriched") {
        fromUrl++;
        console.log("url");
      } else {
        await prisma.article.update({
          where: { id: article.id },
          data: {
            coverImage:
              article.category === "SCAMS"
                ? getScamCoverForSlug(article.slug)
                : getCategoryCoverFallback(article.category),
          },
        });
        fallback++;
        console.log("fallback");
      }
      await sleep(250);
    }

    console.log(`Done. From URL: ${fromUrl}, category fallback: ${fallback}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
