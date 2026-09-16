import dotenv from "dotenv";
import { resolve } from "path";

dotenv.config();
dotenv.config({ path: resolve(process.cwd(), ".env.local"), override: true });

import { translateArticleToRussian } from "../src/lib/llm/translate-ru";
import { isArticleTranslated, hasQualityRussianBody, hasEnglishLeakInRussian } from "../src/lib/article-translated";

async function main() {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  const slug =
    process.argv[2] ??
    "singapore-police-dismantle-pig-butchering-ring-targeting-binance-users";

  const article = await prisma.article.findUnique({
    where: { slug },
    select: { id: true, slug: true, title: true, excerpt: true, content: true, source: true },
  });

  if (!article) {
    console.log("not found:", slug);
    return;
  }

  console.log("EN:", article.title);
    const result = await translateArticleToRussian(article);
    if (
      hasEnglishLeakInRussian(result.titleRu) ||
      hasEnglishLeakInRussian(result.excerptRu)
    ) {
      throw new Error("Translation contains English leak words");
    }
    await prisma.article.update({
    where: { id: article.id },
    data: {
      titleRu: result.titleRu,
      excerptRu: result.excerptRu,
      contentRu: result.contentRu,
    },
  });

  console.log("RU title:", result.titleRu);
  console.log("RU excerpt:", result.excerptRu?.slice(0, 120));
  console.log(
    "ok:",
    isArticleTranslated({ title: article.title, titleRu: result.titleRu }),
    hasQualityRussianBody(result.contentRu),
  );
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
