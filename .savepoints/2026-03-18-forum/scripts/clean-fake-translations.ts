import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { isArticleTranslated } from "../src/lib/article-translated";

const prisma = new PrismaClient();

async function main() {
  const articles = await prisma.article.findMany({
    select: { id: true, slug: true, title: true, titleRu: true },
  });

  const bogus = articles.filter((a) => a.titleRu && !isArticleTranslated(a));
  if (bogus.length === 0) {
    console.log("No bogus titleRu fields to clean.");
    return;
  }

  for (const a of bogus) {
    await prisma.article.update({
      where: { id: a.id },
      data: { titleRu: null, excerptRu: null, contentRu: null },
    });
    console.log(`Cleared fake RU fields: ${a.slug}`);
  }

  console.log(`Done. Cleaned ${bogus.length} article(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
