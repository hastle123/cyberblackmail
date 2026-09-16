import dotenv from "dotenv";
import { resolve } from "path";

dotenv.config();
dotenv.config({ path: resolve(process.cwd(), ".env.local"), override: true });

import { PrismaClient } from "@prisma/client";
import { translateArticleToRussian } from "../src/lib/llm/translate-ru";
import {
  hasEnglishLeakInRussian,
  hasQualityRussianBody,
  isArticleTranslated,
} from "../src/lib/article-translated";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function findBad(prisma: PrismaClient) {
  const all = await prisma.article.findMany({
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      content: true,
      source: true,
      titleRu: true,
      excerptRu: true,
      contentRu: true,
    },
  });
  return all.filter(
    (a) =>
      (a.titleRu && hasEnglishLeakInRussian(a.titleRu)) ||
      (a.excerptRu && hasEnglishLeakInRussian(a.excerptRu)) ||
      (a.contentRu && hasEnglishLeakInRussian(a.contentRu.slice(0, 500))),
  );
}

async function retranslate(article: {
  title: string;
  excerpt: string;
  content: string;
  source: string;
}) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const result = await translateArticleToRussian(article);
      if (hasEnglishLeakInRussian(result.titleRu) || hasEnglishLeakInRussian(result.excerptRu)) {
        throw new Error("English leak in title/excerpt");
      }
      if (!isArticleTranslated({ title: article.title, titleRu: result.titleRu })) {
        throw new Error("Title quality low");
      }
      if (!hasQualityRussianBody(result.contentRu)) {
        throw new Error("Body quality low");
      }
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (attempt === 3) throw new Error(msg);
      await sleep(1500 * attempt);
    }
  }
  throw new Error("unreachable");
}

async function main() {
  const prisma = new PrismaClient();
  const bad = await findBad(prisma);
  console.log(`Bad articles: ${bad.length}`);

  let ok = 0;
  let fail = 0;

  for (const article of bad) {
    process.stdout.write(`\n[${article.slug}] `);
    try {
      const result = await retranslate(article);
      await prisma.article.update({
        where: { id: article.id },
        data: {
          titleRu: result.titleRu,
          excerptRu: result.excerptRu,
          contentRu: result.contentRu,
        },
      });
      ok++;
      console.log("OK");
      console.log("  ", result.titleRu.slice(0, 90));
    } catch (err) {
      fail++;
      console.log("FAIL:", err instanceof Error ? err.message : err);
    }
    await sleep(800);
  }

  const remaining = await findBad(prisma);
  console.log(`\nDone. Fixed: ${ok}, failed: ${fail}, still bad: ${remaining.length}`);
  if (remaining.length) {
    remaining.forEach((a) => console.log(" -", a.slug));
  }
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
