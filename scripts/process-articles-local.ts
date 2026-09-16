import dotenv from "dotenv";
import { resolve } from "path";

dotenv.config();
dotenv.config({ path: resolve(process.cwd(), ".env.local"), override: true });

import { isRssSummaryOnly } from "../src/lib/article-text";
import { isBadRussianArticle } from "../src/lib/audit-ru";
import { hasQualityRussianBody, isArticleTranslated } from "../src/lib/article-translated";
import { isUsableCoverImage } from "../src/lib/article-cover";
import { enrichArticleById, enrichCoverImageById } from "../src/lib/ingest/enrich-article";
import { translateArticleToRussian } from "../src/lib/llm/translate-ru";
import { isOllamaAvailable, getOllamaModel } from "../src/lib/llm/ollama";

const LIMIT = Number(process.env.PROCESS_LIMIT ?? "50");
if (!process.env.TRANSLATE_MODE) process.env.TRANSLATE_MODE = "quality";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function withRetry<T>(fn: () => Promise<T>, label: string, retries = 4): Promise<T> {
  let last: unknown;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      last = err;
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes("Can't reach database") && !msg.includes("P1001") && i === retries - 1) {
        throw err;
      }
      process.stdout.write(` ${label}:retry…`);
      await sleep(2000 * (i + 1));
    }
  }
  throw last;
}

async function main() {
  const { PrismaClient } = await import("@prisma/client");
  let prisma = new PrismaClient();

  const reconnect = async () => {
    try {
      await prisma.$disconnect();
    } catch {
      /* ignore */
    }
    prisma = new PrismaClient();
  };

  try {
    const ok = await isOllamaAvailable();
    if (!ok) {
      console.error("Ollama не запущен. Открой приложение Ollama из меню Пуск.");
      process.exit(1);
    }

    console.log(`Ollama OK — model: ${getOllamaModel()}`);

    const articles = await prisma.article.findMany({
      orderBy: { publishedAt: "desc" },
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        content: true,
        source: true,
        sourceUrl: true,
        category: true,
        titleRu: true,
        contentRu: true,
        coverImage: true,
      },
    });

    const needsWork = (a: (typeof articles)[number]) =>
      isRssSummaryOnly(a.excerpt, a.content, a.sourceUrl) ||
      isBadRussianArticle(a) ||
      !a.coverImage?.trim() ||
      !isUsableCoverImage(a.coverImage ?? "");

    const pending = articles.filter(needsWork).slice(0, LIMIT);
    const totalNeed = articles.filter(needsWork).length;

    console.log(`Всего статей: ${articles.length}, нужна обработка: ${totalNeed}, сейчас: ${pending.length}`);

    let enriched = 0;
    let covers = 0;
    let translated = 0;
    let failed = 0;

    for (const article of pending) {
      process.stdout.write(`\n[${article.slug}]`);

      if (isRssSummaryOnly(article.excerpt, article.content, article.sourceUrl)) {
        process.stdout.write(" fulltext…");
        const r = await enrichArticleById(article.id);
        if (r.status === "enriched") enriched++;
        await sleep(400);
      }

      if (!article.coverImage?.trim() || !isUsableCoverImage(article.coverImage ?? "")) {
        process.stdout.write(" cover…");
        if (article.coverImage?.trim() && !isUsableCoverImage(article.coverImage)) {
          await prisma.article.update({ where: { id: article.id }, data: { coverImage: null } });
        }
        const r = await enrichCoverImageById(article.id);
        if (r.status === "enriched") covers++;
        await sleep(300);
      }

      const fresh = await withRetry(
        () =>
          prisma.article.findUnique({
            where: { id: article.id },
            select: {
              id: true,
              title: true,
              excerpt: true,
              content: true,
              source: true,
              titleRu: true,
              contentRu: true,
              sourceUrl: true,
            },
          }),
        "db",
      ).catch(async () => {
        await reconnect();
        return prisma.article.findUnique({
          where: { id: article.id },
          select: {
            id: true,
            title: true,
            excerpt: true,
            content: true,
            source: true,
            titleRu: true,
            contentRu: true,
            sourceUrl: true,
          },
        });
      });

      if (!fresh) continue;
      if (isArticleTranslated(fresh) && hasQualityRussianBody(fresh.contentRu)) {
        console.log(" RU: ok");
        continue;
      }

      if (isRssSummaryOnly(fresh.excerpt, fresh.content, fresh.sourceUrl)) {
        console.log(" RU: skip (short RSS)");
        failed++;
        continue;
      }

      process.stdout.write(" RU…");
      try {
        const result = await translateArticleToRussian({
          title: fresh.title,
          excerpt: fresh.excerpt,
          content: fresh.content,
          source: fresh.source,
        });

        await withRetry(
          () =>
            prisma.article.update({
              where: { id: fresh.id },
              data: {
                titleRu: result.titleRu,
                excerptRu: result.excerptRu,
                contentRu: result.contentRu,
              },
            }),
          "save",
        ).catch(async () => {
          await reconnect();
          await prisma.article.update({
            where: { id: fresh.id },
            data: {
              titleRu: result.titleRu,
              excerptRu: result.excerptRu,
              contentRu: result.contentRu,
            },
          });
        });

        translated++;
        console.log(" ok");
      } catch (err) {
        failed++;
        console.log(` fail (${err instanceof Error ? err.message : String(err)})`);
      }

      await sleep(800);
    }

    console.log(`\nDone. Fulltext: ${enriched}, covers: ${covers}, RU: ${translated}, failed: ${failed}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
