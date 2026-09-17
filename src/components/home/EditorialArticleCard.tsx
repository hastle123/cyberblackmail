import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SeverityBadge } from "@/components/intel/SeverityBadge";
import { CoverImage } from "@/components/news/CoverImage";
import { editorial } from "@/lib/editorial";
import { formatRelativeTime } from "@/lib/constants";
import { localizeArticle } from "@/lib/localize";
import { cleanFeedSnippet } from "@/lib/article-text";
import { getCategoryCoverFallback, resolveArticleCover } from "@/lib/article-cover";
import type { Category, Severity } from "@prisma/client";

export type ArticleCardData = {
  slug: string;
  title: string;
  excerpt?: string;
  category: Category;
  severity: Severity;
  source: string;
  publishedAt: Date | string;
  intelligenceScore?: number;
  coverImage?: string | null;
  titleRu?: string | null;
  excerptRu?: string | null;
};

export async function EditorialArticleCard({
  article: raw,
  featured = false,
}: {
  article: ArticleCardData;
  featured?: boolean;
}) {
  const locale = await getLocale();
  const article = localizeArticle(
    { ...raw, excerpt: raw.excerpt ?? "", content: "" },
    locale,
  );
  const t = await getTranslations("category");
  const coverSrc = resolveArticleCover({
    coverImage: raw.coverImage,
    category: raw.category,
    slug: raw.slug,
  });

  return (
    <article className={`group lift ${editorial.card} overflow-hidden`}>
      <Link href={`/intel/${raw.slug}`} className="flex h-full flex-col">
        <div className="relative aspect-[16/9] overflow-hidden bg-surface-2">
          <CoverImage
            src={coverSrc}
            fallback={getCategoryCoverFallback(raw.category)}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-surface/70 via-transparent to-transparent" />
          <div className="absolute left-3 top-3">
            <SeverityBadge severity={raw.severity} onImage />
          </div>
        </div>

        <div className={`flex flex-1 flex-col ${featured ? "p-5 md:p-6" : "p-5"}`}>
          <div className="mb-2.5 flex items-center gap-2 text-xs">
            <span className={editorial.kicker}>{t(raw.category)}</span>
            <span className="text-fg-4" aria-hidden>•</span>
            <time className="text-fg-4">{formatRelativeTime(raw.publishedAt, locale)}</time>
          </div>

          <h3 className={`${featured ? editorial.cardTitle : editorial.cardTitleSm} transition-colors group-hover:text-white`}>
            {article.title}
          </h3>

          {article.excerpt && (
            <p className={`mt-2.5 line-clamp-2 ${editorial.bodySm}`}>{cleanFeedSnippet(article.excerpt)}</p>
          )}

          <p className="mt-auto pt-4 text-xs font-medium text-fg-4">{raw.source}</p>
        </div>
      </Link>
    </article>
  );
}

export async function EditorialArticleRow({ article: raw }: { article: ArticleCardData }) {
  const locale = await getLocale();
  const article = localizeArticle(
    { ...raw, excerpt: raw.excerpt ?? "", content: "" },
    locale,
  );
  const t = await getTranslations("category");
  const time = formatRelativeTime(raw.publishedAt, locale);

  return (
    <article className="group relative">
      <Link
        href={`/intel/${raw.slug}`}
        className="grid gap-x-5 rounded-lg px-3 py-5 transition-colors hover:bg-white/[0.025] sm:grid-cols-[92px_1fr] md:px-4"
      >
        <div className="hidden sm:block">
          <time className="block pt-0.5 text-xs tabular-nums text-fg-4">{time}</time>
        </div>
        <div className="min-w-0">
          <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            <span className={editorial.kicker}>{t(raw.category)}</span>
            <span className="text-fg-4" aria-hidden>•</span>
            <span className="text-fg-4">{raw.source}</span>
            <time className="text-fg-4 sm:hidden">· {time}</time>
          </div>
          <h3 className={`${editorial.cardTitleSm} transition-colors group-hover:text-accent-strong`}>
            {article.title}
          </h3>
          {article.excerpt && (
            <p className={`mt-1.5 line-clamp-2 max-w-3xl ${editorial.bodySm}`}>
              {cleanFeedSnippet(article.excerpt)}
            </p>
          )}
        </div>
      </Link>
    </article>
  );
}
