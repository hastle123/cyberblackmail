import { prisma } from "@/lib/prisma";
import { isRssSummaryOnly } from "@/lib/article-text";
import { estimateReadTime } from "./classify";
import { enrichArticleById } from "./enrich-article";

export type EnrichResult = {
  scanned: number;
  enriched: number;
  skipped: number;
  errors: string[];
  articles: { slug: string; title: string; chars: number }[];
};

export type EnrichOptions = {
  limit?: number;
  /** Prefer SCAMS category articles first. */
  priorityScams?: boolean;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function enrichArticles(options?: EnrichOptions): Promise<EnrichResult> {
  const limit = options?.limit ?? (Number(process.env.ENRICH_LIMIT ?? "3") || 3);
  const result: EnrichResult = {
    scanned: 0,
    enriched: 0,
    skipped: 0,
    errors: [],
    articles: [],
  };

  const candidates = await prisma.article.findMany({
    where: { sourceUrl: { not: null } },
    orderBy: { createdAt: "desc" },
    take: 150,
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      content: true,
      sourceUrl: true,
      category: true,
    },
  });

  let pending = candidates.filter((a) =>
    isRssSummaryOnly(a.excerpt, a.content, a.sourceUrl),
  );

  if (options?.priorityScams) {
    pending = [
      ...pending.filter((a) => a.category === "SCAMS"),
      ...pending.filter((a) => a.category !== "SCAMS"),
    ];
  }

  result.scanned = pending.length;

  for (const article of pending.slice(0, limit)) {
    const one = await enrichArticleById(article.id);
    if (one.status === "enriched") {
      result.enriched++;
      result.articles.push({
        slug: article.slug,
        title: article.title,
        chars: one.chars,
      });
    } else if (one.status === "skipped") {
      result.skipped++;
    } else {
      result.errors.push(`${article.slug}: ${one.message}`);
    }
    await sleep(600);
  }

  return result;
}

// re-export for ingest pipelines
export { enrichArticleById } from "./enrich-article";
