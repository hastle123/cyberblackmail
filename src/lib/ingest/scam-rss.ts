import Parser from "rss-parser";
import type { Severity } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { uniqueSlug } from "@/lib/slugify";
import { estimateReadTime } from "./classify";
import { geolocateIncident, incidentTypeFromCategory } from "./geolocate";
import { SCAM_RSS_FEEDS, ensureScamRssSources } from "./scam-sources";
import { isScamArticleContent } from "@/lib/scams";
import { getScamCoverForSlug } from "@/lib/article-cover";
import { enrichArticleById, enrichCoverImageById } from "./enrich-article";
import type { IngestResult, IngestOptions } from "./rss";
import { RSS_PARSER_HEADERS } from "./rss-headers";

type FeedItem = {
  title?: string;
  link?: string;
  contentSnippet?: string;
  content?: string;
  isoDate?: string;
};

const parser = new Parser<FeedItem>({
  timeout: 15_000,
  headers: RSS_PARSER_HEADERS,
});

const MAX_PER_SOURCE = 15;

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function cleanFeedText(text: string): string {
  return text.replace(/\s*\[\.\.\.\]\s*/g, " ").replace(/\s*…\s*$/g, "").replace(/\s+/g, " ").trim();
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

function scamSeverity(text: string): Severity {
  const lower = text.toLowerCase();
  if (/arrest|indicted|million|billion|critical|drainer|pig butcher/i.test(lower)) return "CRITICAL";
  if (/coinbase|binance|crypto|fraud ring|fbi|europol|charged/i.test(lower)) return "HIGH";
  return "MEDIUM";
}

export async function ingestScamRssFeeds(options?: IngestOptions): Promise<IngestResult> {
  await ensureScamRssSources();
  const maxCreates = options?.maxCreates ?? Number.POSITIVE_INFINITY;

  const result: IngestResult = {
    sources: SCAM_RSS_FEEDS.length,
    fetched: 0,
    created: 0,
    skipped: 0,
    errors: [],
    articles: [],
  };

  outer: for (const feedDef of SCAM_RSS_FEEDS) {
    const source = await prisma.source.findUnique({ where: { rssUrl: feedDef.rssUrl } });
    if (!source?.active) continue;

    try {
      const feed = await parser.parseURL(feedDef.rssUrl);
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
        const text = `${title} ${excerpt} ${body}`;

        if (!feedDef.fraudOnly && !isScamArticleContent(title, excerpt)) {
          result.skipped++;
          continue;
        }

        const severity = scamSeverity(text);
        const publishedAt = item.isoDate ? new Date(item.isoDate) : new Date();
        const slug = await uniqueSlug(title, async (s) => !!(await prisma.article.findUnique({ where: { slug: s } })));

        const content =
          body ||
          `${excerpt}\n\nSource: ${feedDef.name}\nOriginal: ${link}\n\nCyberBlackmail scam ingest — full analysis pending.`;

        const article = await prisma.article.create({
          data: {
            slug,
            title,
            excerpt,
            content,
            category: "SCAMS",
            severity,
            intelligenceScore: severity === "CRITICAL" ? 85 : severity === "HIGH" ? 72 : 58,
            source: feedDef.name,
            sourceUrl: link,
            readTime: estimateReadTime(`${title} ${content}`),
            publishedAt,
            coverImage: getScamCoverForSlug(slug),
          },
        });

        await enrichArticleById(article.id);
        await enrichCoverImageById(article.id);

        const geo = geolocateIncident(text, slug);
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
            type: incidentTypeFromCategory("SCAMS"),
            severity,
            intelligenceScore: article.intelligenceScore,
            articleId: article.id,
            countryId: countryRef?.id,
          },
        });

        if (severity === "CRITICAL" || severity === "HIGH") {
          await prisma.alert.create({
            data: {
              message: `Scam alert (${severity.toLowerCase()}): ${title}`,
              messageRu: `Скам (${severity === "CRITICAL" ? "критично" : "высокий"}): ${title}`,
              severity,
              articleId: article.id,
            },
          });
        }

        await prisma.auditLog.create({
          data: {
            action: "SCAM_INGEST_CREATE",
            entity: `article:${article.slug}`,
            metadata: { source: feedDef.name, link },
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
      result.errors.push(`${feedDef.name}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return result;
}
