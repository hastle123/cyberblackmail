import dotenv from "dotenv";
import { resolve } from "path";

dotenv.config();
dotenv.config({ path: resolve(process.cwd(), ".env.local"), override: true });

import { PrismaClient } from "@prisma/client";
import { auditRussianArticle, badRuSeverity } from "../src/lib/audit-ru";
import { enrichArticleById } from "../src/lib/ingest/enrich-article";
import { isRssSummaryOnly } from "../src/lib/article-text";
import { translateArticleToRussian } from "../src/lib/llm/translate-ru";
import {
  hasQualityRussianBody,
  isArticleTranslated,
  isRuTitleAcceptable,
} from "../src/lib/article-translated";
import { isOllamaAvailable } from "../src/lib/llm/ollama";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function retranslate(article: {
  title: string;
  excerpt: string;
  content: string;
  source: string;
}) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    const result = await translateArticleToRussian(article);
    const titleOk = isRuTitleAcceptable(article.title, result.titleRu);
    const bodyOk = hasQualityRussianBody(result.contentRu);
    if (titleOk && bodyOk) return result;
    if (attempt === 4) throw new Error("quality check failed");
    await sleep(1200 * attempt);
  }
  throw new Error("unreachable");
}

async function main() {
  const auditOnly = process.argv.includes("--audit");
  const minArg = process.argv.find((a) => a.startsWith("--min="));
  const limitArg = process.argv.find((a) => a.startsWith("--limit="));
  const minSeverity = minArg ? Number(minArg.split("=")[1]) : 3;
  const limit = limitArg ? Number(limitArg.split("=")[1]) : 9999;
  const prisma = new PrismaClient();

  const all = await prisma.article.findMany({
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      content: true,
      source: true,
      sourceUrl: true,
      titleRu: true,
      excerptRu: true,
      contentRu: true,
    },
  });

  const bad = all
    .map((a) => ({ article: a, reasons: auditRussianArticle(a), severity: 0 }))
    .map((x) => ({ ...x, severity: badRuSeverity(x.reasons) }))
    .filter((x) => x.reasons.length > 0 && x.severity >= minSeverity)
    .sort((a, b) => b.severity - a.severity)
    .slice(0, limit);

  console.log(`Total: ${all.length}, bad: ${bad.length}`);
  for (const { article, reasons } of bad) {
    console.log(`- ${article.slug} [${reasons.join(", ")}]`);
  }

  if (auditOnly) {
    await prisma.$disconnect();
    return;
  }

  if (!(await isOllamaAvailable())) {
    console.error("Ollama not running");
    process.exit(1);
  }

  let ok = 0;
  let fail = 0;

  for (const { article, reasons, severity } of bad) {
    process.stdout.write(`\n[${article.slug}] (${severity}) `);

    if (isRssSummaryOnly(article.excerpt, article.content, article.sourceUrl)) {
      process.stdout.write("enrich…");
      await enrichArticleById(article.id);
      await sleep(400);
    }

    const fresh = await prisma.article.findUnique({
      where: { id: article.id },
      select: {
        id: true,
        title: true,
        excerpt: true,
        content: true,
        source: true,
        sourceUrl: true,
      },
    });
    if (!fresh) {
      console.log(" skip");
      continue;
    }

    if (isRssSummaryOnly(fresh.excerpt, fresh.content, fresh.sourceUrl)) {
      fail++;
      console.log(" skip (short RSS)");
      continue;
    }

    process.stdout.write(" RU…");
    try {
      const result = await retranslate(fresh);
      await prisma.article.update({
        where: { id: fresh.id },
        data: {
          titleRu: result.titleRu,
          excerptRu: result.excerptRu,
          contentRu: result.contentRu,
        },
      });
      ok++;
      console.log(" OK");
      console.log(" ", result.titleRu.slice(0, 85));
    } catch (err) {
      fail++;
      console.log(` FAIL (${err instanceof Error ? err.message : String(err)})`);
    }
    await sleep(700);
  }

  const left = all
    .map((a) => ({ slug: a.slug, reasons: auditRussianArticle(a) }))
    .filter((x) => x.reasons.length > 0);

  console.log(`\nDone. OK: ${ok}, fail: ${fail}, still bad: ${left.length}`);
  left.forEach((x) => console.log(` - ${x.slug} [${x.reasons.join(", ")}]`));

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
