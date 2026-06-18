import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SeverityBadge } from "@/components/intel/SeverityBadge";
import { HeroEditorialVisual } from "@/components/home/HeroEditorialVisual";
import { editorial } from "@/lib/editorial";
import { formatRelativeTime } from "@/lib/constants";
import { localizeArticle } from "@/lib/localize";
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

  return (
    <section className="mb-12 animate-fade-up">
      <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-10">
        <Link
          href={`/intel/${article.slug}`}
          className="group relative order-2 block aspect-[16/10] overflow-hidden rounded-sm border border-white/[0.06] bg-[#141414] lg:order-1"
        >
          {props.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={props.coverImage}
              alt=""
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
          ) : (
            <HeroEditorialVisual
              categoryLabel={t(props.category)}
              headline={article.title}
            />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
          <div className="absolute bottom-4 left-4 flex items-center gap-2">
            <SeverityBadge severity={props.severity} small={false} />
            {props.intelligenceScore != null && props.intelligenceScore >= 70 && (
              <span className={editorial.tag}>{tHome("highConfidence")}</span>
            )}
          </div>
        </Link>

        <div className="order-1 flex flex-col justify-center lg:order-2">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span className={editorial.breaking}>{tHome("featuredInvestigation")}</span>
            <span className={editorial.kicker}>{t(props.category)}</span>
          </div>

          <Link href={`/intel/${article.slug}`} className="group block">
            <h1 className={`${editorial.heroTitle} transition-colors group-hover:text-[#e5e5e5]`}>
              {article.title}
            </h1>
            <p className={`mt-5 max-w-xl ${editorial.body}`}>{article.excerpt}</p>
          </Link>

          <div className={`mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 ${editorial.byline}`}>
            <span>{tHome("analystDesk")}</span>
            <span className="text-[#404040]">·</span>
            <span>{article.source}</span>
            <span className="text-[#404040]">·</span>
            <time>{formatRelativeTime(article.publishedAt, locale)}</time>
            {article.readTime != null && (
              <>
                <span className="text-[#404040]">·</span>
                <span>{tArticle("readTime", { minutes: article.readTime })}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
