import { Link } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { IntelShell } from "@/components/layout/IntelShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { SeverityBadge } from "@/components/intel/SeverityBadge";
import { IntelligenceScoreGauge } from "@/components/intel/IntelligenceScoreGauge";
import { ThreatTimeline } from "@/components/intel/ThreatTimeline";
import { formatDate, jsonArray } from "@/lib/constants";
import { editorial } from "@/lib/editorial";
import { getActorBySlug } from "@/lib/data";
import { localizeArticleRef } from "@/lib/localize";
import type { Locale } from "@/i18n/routing";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const actor = await getActorBySlug(slug);
  return { title: actor?.name ?? "Actor Not Found" };
}

export default async function ActorDetailPage({ params }: Props) {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("actorsPage");
  const tCommon = await getTranslations("common");
  const { slug } = await params;
  const actor = await getActorBySlug(slug);
  if (!actor) notFound();

  const timelineEvents = actor.campaigns.flatMap((c) => c.timeline);
  const aliases = jsonArray(actor.aliases);
  const ttps = jsonArray(actor.ttps);

  return (
    <IntelShell maxWidth="wide">
      <PageHeader
        title={actor.name}
        subtitle={`${actor.type} · ${actor.origin ?? t("unknownOrigin")}`}
      >
        <div className="flex items-center gap-3">
          <SeverityBadge severity={actor.threatLevel} />
          <IntelligenceScoreGauge score={actor.intelligenceScore} label={tCommon("intelScore")} />
        </div>
      </PageHeader>

      <div className={`${editorial.panel} mb-8 p-6`}>
        <p className={editorial.body}>{actor.description}</p>
        {aliases.length > 0 && (
          <p className={`mt-4 ${editorial.meta}`}>
            {t("aliases")}: {aliases.join(", ")}
          </p>
        )}
        {actor.motivation && (
          <p className={`mt-2 ${editorial.meta}`}>
            {t("motivation")}: {actor.motivation}
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {ttps.map((ttp) => (
            <span key={ttp} className={editorial.tag}>
              {ttp}
            </span>
          ))}
        </div>
      </div>

      {timelineEvents.length > 0 && (
        <section className="mb-8">
          <ThreatTimeline events={timelineEvents} actorNames={[actor.name]} />
        </section>
      )}

      <section>
        <h2 className={editorial.sectionTitle}>{t("intelReports")}</h2>
        <ul className="mt-4 space-y-2">
          {actor.articles.map(({ article }) => {
            const localized = localizeArticleRef(article, locale);
            return (
              <li key={article.slug}>
                <Link href={`/intel/${article.slug}`} className={`${editorial.link} flex items-center gap-2 text-sm`}>
                  <SeverityBadge severity={article.severity} />
                  {localized.title}
                  <span className={editorial.meta}>{formatDate(article.publishedAt, locale)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {actor.ransomware && (
        <section className="mt-8">
          <Link
            href={`/ransomware/${actor.ransomware.slug}`}
            className={`${editorial.panel} inline-flex items-center gap-2 px-4 py-3 ${editorial.link} text-sm`}
          >
            {t("viewRansomware")}: {actor.ransomware.name}
          </Link>
        </section>
      )}
    </IntelShell>
  );
}
