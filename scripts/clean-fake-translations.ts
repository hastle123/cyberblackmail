import dotenv from "dotenv";
import { resolve } from "path";

dotenv.config();
dotenv.config({ path: resolve(process.cwd(), ".env.local"), override: true });

import { PrismaClient } from "@prisma/client";
import {
  hasQualityRussianBody,
  isArticleTranslated,
  isPlaceholderRussian,
} from "../src/lib/article-translated";

const prisma = new PrismaClient();

async function main() {
  const articles = await prisma.article.findMany({
    select: { id: true, slug: true, title: true, titleRu: true, excerptRu: true, contentRu: true },
  });

  const bogus = articles.filter((a) => {
    if (!a.titleRu && !a.contentRu) return false;
    if (a.titleRu && !isArticleTranslated(a)) return true;
    if (a.contentRu && !hasQualityRussianBody(a.contentRu)) return true;
    if (a.excerptRu && isPlaceholderRussian(a.excerptRu)) return true;
    return false;
  });

  if (bogus.length === 0) {
    console.log("No bad RU fields to clean.");
    return;
  }

  for (const a of bogus) {
    await prisma.article.update({
      where: { id: a.id },
      data: { titleRu: null, excerptRu: null, contentRu: null },
    });
    console.log(`Cleared bad RU: ${a.slug}`);
  }

  console.log(`Done. Cleaned ${bogus.length} article(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
