import Parser from "rss-parser";
import { Prisma, type Category, type Severity } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { uniqueSlug } from "@/lib/slugify";
import { classifyArticle, estimateReadTime } from "./classify";
import { geolocateIncident, incidentTypeFromCategory } from "./geolocate";
import { ensureRssSources } from "./sources";
import { enrichArticleById } from "./enrich-article";
import { buildRussianFields } from "./translate";
import { pickImageFromRssItem } from "@/lib/article-cover";
import { RSS_PARSER_HEADERS } from "./rss-headers";

type FeedItem = {
  title?: string;
  link?: string;
  contentSnippet?: string;
  content?: string;
  isoDate?: string;
};

export type IngestResult = {
  sources: number;
  fetched: number;
  created: number;
  skipped: number;
  errors: string[];
  articles: { slug: string; title: string }[];
  stoppedEarly?: boolean;
};

export type IngestOptions = {
  /** Skip LLM/MyMemory translation (fast path for cron on Vercel). */
  skipTranslate?: boolean;
  /** Stop after creating N new articles (avoids serverless timeouts). */
  maxCreates?: number;
};

const parser = new Parser<FeedItem>({
  timeout: 15_000,
  headers: RSS_PARSER_HEADERS,
});

const MAX_PER_SOURCE = 12;

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** BleepingComputer and others end RSS snippets with "[...]". */
function cleanFeedText(text: string): string {
  return text
    .replace(/\s*\[\.\.\.\]\s*/g, " ")
    .replace(/\s*…\s*$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function pickBody(item: FeedItem): string {
  const raw = item.contentSnippet || item.content || "";
  return cleanFeedText(stripHtml(raw)).slice(0, 4000);
}

function pickExcerpt(body: string, title: string): string {
  const text = body || title;
  const slice = text.slice(0, 280);
  return slice + (text.length > 280 ? "…" : "");
}

function alertMessageRu(title: string, severity: Severity): string {
  const prefix =
    severity === "CRITICAL" ? "Критично" : severity === "HIGH" ? "Высокий" : "Средний";
  return `${prefix}: ${title}`;
}

function shouldTranslate(options?: IngestOptions): boolean {
  if (options?.skipTranslate) return false;
  if (process.env.INGEST_SKIP_TRANSLATE === "1") return false;
  return (
    Boolean(process.env.GEMINI_API_KEY?.trim()) ||
    Boolean(process.env.GROQ_API_KEY?.trim()) ||
    Boolean(process.env.OPENAI_API_KEY?.trim())
  );
}

export async function ingestRssFeeds(options?: IngestOptions): Promise<IngestResult> {
  await ensureRssSources();
  const maxCreates = options?.maxCreates ?? Number.POSITIVE_INFINITY;
  const translate = shouldTranslate(options);
  const sources = await prisma.source.findMany({ where: { active: true } });
  const result: IngestResult = {
    sources: sources.length,
    fetched: 0,
    created: 0,
    skipped: 0,
    errors: [],
    articles: [],
  };

  if (sources.length === 0) {
    result.errors.push("No active RSS sources in database — run npm run ingest:setup");
    return result;
  }

  outer: for (const source of sources) {
    try {
      const feed = await parser.parseURL(source.rssUrl);
      const items = (feed.items ?? []).slice(0, MAX_PER_SOURCE);
      result.fetched += items.length;

      for (const item of items) {
        const title = item.title?.trim();
        const link = item.link?.trim();
        if (!title || !link) {
          result.skipped++;
          continue;
        }

        const existing = await prisma.article.findFirst({
          where: { OR: [{ sourceUrl: link }, { title }] },
        });
        if (existing) {
          result.skipped++;
          continue;
        }

        const body = pickBody(item);
        const excerpt = pickExcerpt(body, title);
        const coverImage = pickImageFromRssItem(item.content);
        const text = `${title} ${excerpt} ${body}`;
        const { category, severity } = classifyArticle(text);
        const publishedAt = item.isoDate ? new Date(item.isoDate) : new Date();
        const slug = await uniqueSlug(title, async (s) => !!(await prisma.article.findUnique({ where: { slug: s } })));
        let ru = { titleRu: null as string | null, excerptRu: null as string | null, contentRu: null as string | null };
        if (translate) {
          try {
            ru = await buildRussianFields(title, excerpt, body, source.name);
          } catch {
            /* EN-only article is fine */
          }
        }

        const content =
          body ||
          `${excerpt}\n\nSource: ${source.name}\nOriginal: ${link}\n\nCyberBlackmail auto-ingest — full analysis pending.`;

        let article;
        try {
          article = await prisma.article.create({
            data: {
              slug,
              title,
              excerpt,
              content,
              titleRu: ru.titleRu,
              excerptRu: ru.excerptRu,
              contentRu: ru.contentRu,
              category,
              severity,
              intelligenceScore: severity === "CRITICAL" ? 85 : severity === "HIGH" ? 72 : 58,
              source: source.name,
              sourceUrl: link,
              coverImage,
              readTime: estimateReadTime(`${title} ${content}`),
              publishedAt,
            },
          });
        } catch (err) {
          if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
            result.skipped++;
            continue;
          }
          throw err;
        }

        await enrichArticleById(article.id);

        const geo = geolocateIncident(`${title} ${excerpt}`, slug);
        const countryRef = await prisma.country.findUnique({
          where: { code: geo.countryCode },
          select: { id: true },
        });

        await prisma.incident.create({
          data: {
            lat: geo.lat,
            lng: geo.lng,
            country: geo.country,
            city: geo.city,
            type: incidentTypeFromCategory(category),
            severity,
            intelligenceScore: article.intelligenceScore,
            articleId: article.id,
            countryId: countryRef?.id,
          },
        });

        if (severity === "CRITICAL" || severity === "HIGH") {
          await prisma.alert.create({
            data: {
              message: `New ${severity.toLowerCase()} report: ${title}`,
              messageRu: alertMessageRu(ru.titleRu || title, severity),
              severity,
              articleId: article.id,
            },
          });
        }

        await prisma.auditLog.create({
          data: {
            action: "INGEST_CREATE",
            entity: `article:${article.slug}`,
            metadata: { source: source.name, link },
          },
        });

        result.created++;
        result.articles.push({ slug: article.slug, title });

        if (result.created >= maxCreates) {
          result.stoppedEarly = true;
          break outer;
        }
      }

      await prisma.source.update({
        where: { id: source.id },
        data: { lastFetched: new Date() },
      });
    } catch (err) {
      result.errors.push(`${source.name}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return result;
}
