import { PrismaClient } from "@prisma/client";
import { hasQualityRussianBody, isArticleTranslated } from "../src/lib/article-translated";

async function main() {
  const p = new PrismaClient();
  const all = await p.article.findMany({
    select: { title: true, titleRu: true, contentRu: true, coverImage: true },
  });
  const ruOk = all.filter((a) => isArticleTranslated(a) && hasQualityRussianBody(a.contentRu));
  const withCover = all.filter((a) => a.coverImage?.trim());
  console.log(`Статей: ${all.length}`);
  console.log(`RU перевод OK: ${ruOk.length}`);
  console.log(`С обложкой: ${withCover.length}`);
  await p.$disconnect();
}

main();
