import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { editorial } from "@/lib/editorial";
import { formatRelativeTime } from "@/lib/constants";
import { localizeArticle } from "@/lib/localize";
import type { Category } from "@prisma/client";

type FeaturedHeroProps = {
  slug: string;
  title: string;
  excerpt: string;
  category: Category;
  source: string;
  publishedAt: Date | string;
  readTime?: number;
  titleRu?: string | null;
  excerptRu?: string | null;
};

export async function FeaturedHero(props: FeaturedHeroProps) {
  const locale = await getLocale();
  const article = localizeArticle({ ...props, content: "", excerpt: props.excerpt }, locale);
  const t = await getTranslations("category");
  const tArticle = await getTranslations("article");

  return (
    <article className="group border-b border-white/[0.07] pb-8">
      <Link href={`/intel/${article.slug}`} className="block">
        <div className="mb-3">
          <span className={editorial.kicker}>{t(props.category)}</span>
        </div>

        <h1 className="font-serif text-3xl font-bold leading-tight text-[#f0f0f0] transition-colors group-hover:text-[#e52525] md:text-4xl lg:text-[2.75rem]">
          {article.title}
        </h1>

        <p className="mt-4 max-w-3xl text-base leading-relaxed text-[#a3a3a3] md:text-lg">
          {article.excerpt}
        </p>

        <div className={`mt-5 flex flex-wrap items-center gap-3 ${editorial.byline}`}>
          <span>{article.source}</span>
          <span className="text-[#444]">·</span>
          <time>{formatRelativeTime(article.publishedAt, locale)}</time>
          {article.readTime != null && (
            <>
              <span className="text-[#444]">·</span>
              <span>{tArticle("readTime", { minutes: article.readTime })}</span>
            </>
          )}
        </div>
      </Link>
    </article>
  );
}
