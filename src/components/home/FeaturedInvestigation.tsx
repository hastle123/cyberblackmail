import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SeverityBadge } from "@/components/intel/SeverityBadge";
import { CoverImage } from "@/components/news/CoverImage";
import { editorial } from "@/lib/editorial";
import { getCategoryCoverFallback, resolveArticleCover } from "@/lib/article-cover";
import { formatRelativeTime } from "@/lib/constants";
import { localizeArticle } from "@/lib/localize";
import { cleanFeedSnippet } from "@/lib/article-text";
import type { Category, Severity } from "@prisma/client";

type Props = {
  slug: string;
  title: string;
  excerpt: string;
  category: Category;
  severity: Severity;
  source: string;
  publishedAt: Date | string;
  readTime?: number;
  intelligenceScore?: number;
  coverImage?: string | null;
  titleRu?: string | null;
  excerptRu?: string | null;
};

export async function FeaturedInvestigation(props: Props) {
  const locale = await getLocale();
  const article = localizeArticle({ ...props, content: "" }, locale);
  const t = await getTranslations("category");
  const tHome = await getTranslations("homePage");
  const tArticle = await getTranslations("article");

  const coverSrc = resolveArticleCover({
    coverImage: props.coverImage,
    category: props.category,
    slug: props.slug,
  });

  return (
    <article className="group relative isolate min-h-[460px] overflow-hidden rounded-2xl border border-line bg-surface animate-fade-up lg:min-h-[540px]">
      <CoverImage
        src={coverSrc}
        fallback={getCategoryCoverFallback(props.category)}
        eager
        className="absolute inset-0 -z-10 h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.03]"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-canvas via-canvas/60 to-transparent" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-canvas/80 via-canvas/20 to-transparent" />

      <Link
        href={`/intel/${article.slug}`}
        className="flex h-full min-h-[inherit] flex-col justify-end p-6 md:p-9 lg:p-11"
      >
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span className={editorial.breaking}>
            <span className="h-1.5 w-1.5 rounded-full bg-white" aria-hidden />
            {tHome("featuredInvestigation")}
          </span>
          <span className={editorial.tag}>{t(props.category)}</span>
          <SeverityBadge severity={props.severity} small={false} onImage />
          {props.intelligenceScore != null && props.intelligenceScore >= 70 && (
            <span className={`${editorial.tag} hidden sm:inline-flex`}>{tHome("highConfidence")}</span>
          )}
        </div>

        <h1 className={`${editorial.heroTitle} max-w-3xl text-balance`}>{article.title}</h1>

        {article.excerpt && (
          <p className="mt-4 line-clamp-3 max-w-2xl text-[15px] leading-relaxed text-fg-2 md:text-base">
            {cleanFeedSnippet(article.excerpt)}
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-fg-3">
          <span className="font-medium text-fg-2">{article.source}</span>
          <span className="text-fg-4" aria-hidden>•</span>
          <time dateTime={new Date(props.publishedAt).toISOString()}>
            {formatRelativeTime(article.publishedAt, locale)}
          </time>
          {article.readTime != null && (
            <>
              <span className="text-fg-4" aria-hidden>•</span>
              <span>{tArticle("readTime", { minutes: article.readTime })}</span>
            </>
          )}
          <span className="ml-auto hidden items-center gap-1.5 font-medium text-fg transition-transform group-hover:translate-x-0.5 md:inline-flex">
            {tHome("readStory")} <span aria-hidden>→</span>
          </span>
        </div>
      </Link>
    </article>
  );
}
