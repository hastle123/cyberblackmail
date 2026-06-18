import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { IntelShell } from "@/components/layout/IntelShell";
import { CollapsibleSection } from "@/components/layout/CollapsibleSection";
import { ThreatAnalysisPanel } from "@/components/intel/ThreatAnalysisPanel";
import { ThreatTimeline } from "@/components/intel/ThreatTimeline";
import { IOCBlock } from "@/components/intel/IOCBlock";
import { editorial } from "@/lib/editorial";
import { formatDate } from "@/lib/constants";
import { getArticleBySlug } from "@/lib/data";
import { localizeAnalysis, localizeArticle, isArticleTranslated } from "@/lib/localize";
import type { Locale } from "@/i18n/routing";

type Props = { params: Promise<{ slug: string; locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug, locale } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return { title: "Report Not Found" };
  const localized = localizeArticle(article, locale as Locale);
  return { title: localized.title };
}

export default async function IntelDetailPage({ params }: Props) {
  const { slug, locale: localeParam } = await params;
  const locale = localeParam as Locale;
  const raw = await getArticleBySlug(slug);
  if (!raw) notFound();

  const article = localizeArticle(raw, locale);
  const analysis = raw.threatAnalysis
    ? localizeAnalysis(raw.threatAnalysis, locale)
    : null;

  const t = await getTranslations("article");
  const tCat = await getTranslations("category");
  const iocs = raw.iocs.map(({ ioc }) => ioc);

  const actorNames = raw.actors.map(({ actor }) => actor.name);
  const untranslated = locale === "ru" && !isArticleTranslated(raw);

  return (
    <IntelShell maxWidth="wide">
      <article className="mx-auto max-w-3xl">
        <header className="mb-8 border-b border-white/[0.07] pb-8">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className={editorial.kicker}>{tCat(raw.category)}</span>
            {untranslated && (
              <span className="rounded border border-[#c41e1e]/30 bg-[#c41e1e]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#e52525]">
                {t("untranslatedBadge")}
              </span>
            )}
          </div>

          <h1 className="font-serif text-3xl font-bold leading-tight text-[#f0f0f0] md:text-4xl">
            {article.title}
          </h1>

          {untranslated && (
            <p className={`mt-4 rounded-lg border border-white/[0.08] bg-[#141414] p-4 ${editorial.body}`}>
              {t("untranslatedNotice")}
            </p>
          )}

          <p className="mt-4 text-lg leading-relaxed text-[#a3a3a3]">{article.excerpt}</p>

          <div className={`mt-6 flex flex-wrap items-center gap-3 ${editorial.byline}`}>
            <span>{article.source}</span>
            <span className="text-[#444]">·</span>
            <time>{formatDate(article.publishedAt, locale)}</time>
            <span className="text-[#444]">·</span>
            <span>{t("readTime", { minutes: article.readTime })}</span>
          </div>
        </header>

        <div
          className="prose prose-invert max-w-none text-[1.05rem] leading-[1.75] text-[#d4d4d4] prose-headings:font-serif prose-headings:text-[#f0f0f0] prose-a:text-[#e52525]"
          dangerouslySetInnerHTML={{ __html: article.content.replace(/\n/g, "<br />") }}
        />

        {analysis && (
          <div className="mt-12">
            <ThreatAnalysisPanel analysis={analysis} />
          </div>
        )}

        {raw.timeline.length > 0 && (
          <CollapsibleSection title={t("timeline")}>
            <ThreatTimeline events={raw.timeline} actorNames={actorNames} />
          </CollapsibleSection>
        )}

        {iocs.length > 0 && (
          <CollapsibleSection title={t("iocs")}>
            <IOCBlock iocs={iocs} />
          </CollapsibleSection>
        )}

        {raw.actors.length > 0 && (
          <CollapsibleSection title={t("actors")}>
            <div className="flex flex-wrap gap-2">
              {raw.actors.map(({ actor }) => (
                <Link key={actor.slug} href={`/actors/${actor.slug}`} className={editorial.tag}>
                  {actor.name}
                </Link>
              ))}
            </div>
          </CollapsibleSection>
        )}
      </article>
    </IntelShell>
  );
}
