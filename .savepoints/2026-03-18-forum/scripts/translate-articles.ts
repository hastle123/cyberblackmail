import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { isArticleTranslated } from "../src/lib/article-translated";
import { translateArticleFields } from "../src/lib/ingest/translate";

const prisma = new PrismaClient();
const LIMIT = Number(process.env.TRANSLATE_LIMIT ?? "20");
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const all = await prisma.article.findMany({
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      content: true,
      source: true,
      titleRu: true,
    },
  });

  const pending = all.filter((a) => !isArticleTranslated(a)).slice(0, LIMIT);
  console.log(`Found ${all.length} articles, ${pending.length} need translation (limit ${LIMIT})`);

  let done = 0;
  let groqAuthFailed = false;
  for (const article of pending) {
    if (groqAuthFailed && !process.env.GEMINI_API_KEY?.trim()) break;

    process.stdout.write(`Translating: ${article.slug}… `);
    try {
      const ru = await translateArticleFields(article);
      if (!isArticleTranslated({ title: article.title, titleRu: ru.titleRu })) {
        console.log("skip (no translation)");
        await sleep(1500);
        continue;
      }
      await prisma.article.update({
        where: { id: article.id },
        data: {
          titleRu: ru.titleRu,
          excerptRu: ru.excerptRu,
          contentRu: ru.contentRu,
        },
      });
      done++;
      console.log("ok");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`fail (${msg.slice(0, 80)})`);
      if (msg.includes("Groq 403") || msg.includes("Groq 401")) {
        groqAuthFailed = true;
        console.error("\nGroq ключ не работает (403/401). Добавьте GEMINI_API_KEY в .env:");
        console.error("https://aistudio.google.com/apikey\n");
        break;
      }
      await sleep(1500);
    }
  }

  console.log(`Done. Translated ${done} article(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
