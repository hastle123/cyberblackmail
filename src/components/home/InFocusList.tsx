import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SeverityDot } from "@/components/intel/SeverityBadge";
import { CoverImage } from "@/components/news/CoverImage";
import { editorial } from "@/lib/editorial";
import { formatRelativeTime } from "@/lib/constants";
import { localizeArticle } from "@/lib/localize";
import { getCategoryCoverFallback, resolveArticleCover } from "@/lib/article-cover";
import type { ArticleCardData } from "@/components/home/EditorialArticleCard";

/** Compact list of secondary stories beside the hero */
export async function InFocusList({ articles }: { articles: ArticleCardData[] }) {
  const locale = await getLocale();
  const t = await getTranslations("category");
  const tSidebar = await getTranslations("sidebar");
  const tHome = await getTranslations("homePage");

  if (articles.length === 0) return null;

  return (
    <aside className={`${editorial.panel} flex flex-col overflow-hidden animate-fade-up`}>
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <h2 className="flex items-center gap-2.5 text-sm font-semibold text-fg">
          <span className="live-dot" aria-hidden />
          {tSidebar("inFocus")}
        </h2>
        <Link href="/intel" className="text-xs font-medium text-fg-3 transition-colors hover:text-fg">
          {tHome("viewAll")} →
        </Link>
      </div>

      <ul className="flex flex-1 flex-col divide-y divide-line">
        {articles.map((raw) => {
          const article = localizeArticle({ ...raw, excerpt: raw.excerpt ?? "", content: "" }, locale);
          const cover = resolveArticleCover({
            coverImage: raw.coverImage,
            category: raw.category,
            slug: raw.slug,
          });
          return (
            <li key={raw.slug} className="flex-1">
              <Link
                href={`/intel/${raw.slug}`}
                className="group flex h-full gap-4 px-5 py-4 transition-colors hover:bg-white/[0.025]"
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex items-center gap-2 text-[11px]">
                    <SeverityDot severity={raw.severity} className="h-1.5 w-1.5" />
                    <span className={editorial.kicker}>{t(raw.category)}</span>
                    <span className="text-fg-4">{formatRelativeTime(raw.publishedAt, locale)}</span>
                  </div>
                  <h3 className="line-clamp-3 font-serif text-[15px] font-semibold leading-snug text-fg-2 transition-colors group-hover:text-fg">
                    {article.title}
                  </h3>
                </div>
                <div className="relative h-[68px] w-[84px] shrink-0 overflow-hidden rounded-lg bg-surface-2">
                  <CoverImage
                    src={cover}
                    fallback={getCategoryCoverFallback(raw.category)}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
