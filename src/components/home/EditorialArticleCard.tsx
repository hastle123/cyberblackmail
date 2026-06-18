import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SeverityBadge } from "@/components/intel/SeverityBadge";
import { editorial } from "@/lib/editorial";
import { formatRelativeTime } from "@/lib/constants";
import { localizeArticle } from "@/lib/localize";
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

  return (
    <article className={`group ${editorial.card} ${featured ? "p-6" : "p-5"}`}>
      <Link href={`/intel/${raw.slug}`} className="block">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className={editorial.kicker}>{t(raw.category)}</span>
          <SeverityBadge severity={raw.severity} />
          <time className={editorial.meta}>{formatRelativeTime(raw.publishedAt, locale)}</time>
        </div>

        <h3 className={featured ? editorial.cardTitle : editorial.cardTitleSm}>
          <span className="transition-colors group-hover:text-[#dc2626]">{article.title}</span>
        </h3>

        {article.excerpt && (
          <p className={`mt-3 line-clamp-3 ${editorial.bodySm}`}>{article.excerpt}</p>
        )}

        <p className={`mt-4 ${editorial.byline}`}>{raw.source}</p>
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

  return (
    <article className="group border-b border-white/[0.05] py-5 last:border-0">
      <Link href={`/intel/${raw.slug}`} className="grid gap-3 md:grid-cols-[1fr_auto] md:items-start">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className={editorial.kicker}>{t(raw.category)}</span>
            <SeverityBadge severity={raw.severity} />
          </div>
          <h3 className={`${editorial.cardTitleSm} transition-colors group-hover:text-[#dc2626]`}>
            {article.title}
          </h3>
          {article.excerpt && (
            <p className={`mt-2 line-clamp-2 max-w-2xl ${editorial.bodySm}`}>{article.excerpt}</p>
          )}
        </div>
        <div className={`md:text-right ${editorial.meta}`}>
          <time className="block">{formatRelativeTime(raw.publishedAt, locale)}</time>
          <span className="mt-1 block uppercase tracking-wider">{raw.source}</span>
        </div>
      </Link>
    </article>
  );
}
