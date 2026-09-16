import { prisma } from "@/lib/prisma";
import { isRssSummaryOnly } from "@/lib/article-text";
import { getCategoryCoverFallback, getScamCoverForSlug, isGenericScamCover, isUsableCoverImage } from "@/lib/article-cover";
import { estimateReadTime } from "./classify";
import { fetchArticleFromUrl, fetchCoverImageFromUrl } from "./fetch-article";
export type EnrichOneResult =
  | { status: "enriched"; chars: number }
  | { status: "skipped"; reason: string }
  | { status: "error"; message: string };

/** Fetch full article text from sourceUrl and update DB. */
export async function enrichArticleById(articleId: string): Promise<EnrichOneResult> {
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      content: true,
      sourceUrl: true,
    },
  });

  if (!article?.sourceUrl) {
    return { status: "skipped", reason: "no sourceUrl" };
  }

  if (!isRssSummaryOnly(article.excerpt, article.content, article.sourceUrl)) {
    return { status: "skipped", reason: "already full text" };
  }

  try {
    const fetched = await fetchArticleFromUrl(article.sourceUrl);
    if (!fetched) {
      return { status: "skipped", reason: "fetch failed" };
    }

    const hasText = fetched.content.length > article.content.length + 80;
    const hasImage = Boolean(fetched.image);

    if (!hasText && !hasImage) {
      return { status: "skipped", reason: "fetch empty or too short" };
    }

    await prisma.article.update({
      where: { id: article.id },
      data: {
        ...(hasText
          ? {
              excerpt: fetched.excerpt,
              content: fetched.content,
              readTime: estimateReadTime(`${article.title} ${fetched.content}`),
            }
          : {}),
        ...(fetched.image && isUsableCoverImage(fetched.image) ? { coverImage: fetched.image } : {}),
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "ENRICH_FULLTEXT",
        entity: `article:${article.slug}`,
        metadata: {
          url: article.sourceUrl,
          chars: fetched.content.length,
          image: Boolean(fetched.image),
        },
      },
    });

    return { status: "enriched", chars: fetched.content.length };
  } catch (err) {
    return {
      status: "error",
      message: err instanceof Error ? err.message : String(err),
    };
  }
}

/** Set coverImage from sourceUrl when missing. */
export async function enrichCoverImageById(articleId: string): Promise<EnrichOneResult> {
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    select: { id: true, slug: true, sourceUrl: true, coverImage: true },
  });

  if (!article?.sourceUrl) {
    if (article?.slug && isGenericScamCover(article.coverImage)) {
      await prisma.article.update({
        where: { id: article.id },
        data: { coverImage: getScamCoverForSlug(article.slug) },
      });
      return { status: "enriched", chars: 0 };
    }
    return { status: "skipped", reason: "no sourceUrl" };
  }
  if (article.coverImage?.trim() && !isGenericScamCover(article.coverImage)) {
    return { status: "skipped", reason: "has coverImage" };
  }

  try {
    const image = await fetchCoverImageFromUrl(article.sourceUrl);
    if (!image || !isUsableCoverImage(image)) {
      if (article.slug) {
        await prisma.article.update({
          where: { id: article.id },
          data: { coverImage: getScamCoverForSlug(article.slug) },
        });
        return { status: "enriched", chars: 0 };
      }
      return { status: "skipped", reason: "no image found" };
    }

    await prisma.article.update({
      where: { id: article.id },
      data: { coverImage: image },
    });

    return { status: "enriched", chars: 0 };
  } catch (err) {
    return {
      status: "error",
      message: err instanceof Error ? err.message : String(err),
    };
  }
}
