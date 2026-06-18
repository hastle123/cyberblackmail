import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { formatRelativeTime } from "@/lib/constants";
import { localizeArticle } from "@/lib/localize";
import type { Category } from "@prisma/client";

export type FeedArticleProps = {
  slug: string;
  title: string;
  excerpt?: string;
  category: Category;
  source: string;
  publishedAt: Date | string;
  titleRu?: string | null;
  excerptRu?: string | null;
  compact?: boolean;
};

export async function FeedArticle(props: FeedArticleProps) {
  const locale = await getLocale();
  const article = localizeArticle(
    { ...props, excerpt: props.excerpt ?? "", content: "" },
    locale,
  );
  const t = await getTranslations("category");

  return (
    <article className="group border-b border-white/[0.05] py-4 last:border-0">
      <Link href={`/intel/${props.slug}`} className="block">
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#c41e1e]">
            {t(props.category)}
          </span>
          <span className="text-[10px] text-[#555]">·</span>
          <time className="text-[10px] text-[#555]">
            {formatRelativeTime(props.publishedAt, locale)}
          </time>
        </div>

        <h2
          className={`font-serif leading-snug text-[#e8e8e8] transition-colors group-hover:text-[#e52525] ${props.compact ? "text-base font-semibold" : "text-lg font-bold md:text-xl"}`}
        >
          {article.title}
        </h2>

        {!props.compact && article.excerpt && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#888]">{article.excerpt}</p>
        )}

        <p className="mt-2 text-[10px] font-medium uppercase tracking-wider text-[#555]">
          {props.source}
        </p>
      </Link>
    </article>
  );
}
