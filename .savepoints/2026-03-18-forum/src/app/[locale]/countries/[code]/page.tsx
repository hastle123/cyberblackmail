import { Link } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { IntelShell } from "@/components/layout/IntelShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { IntelligenceScoreGauge } from "@/components/intel/IntelligenceScoreGauge";
import { SeverityBadge } from "@/components/intel/SeverityBadge";
import { editorial } from "@/lib/editorial";
import { formatDate } from "@/lib/constants";
import { getCountryByCode } from "@/lib/data";
import { localizeArticleRef } from "@/lib/localize";
import type { Locale } from "@/i18n/routing";

type Props = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Props) {
  const { code } = await params;
  const country = await getCountryByCode(code);
  return { title: country?.name ?? "Country Not Found" };
}

export default async function CountryDetailPage({ params }: Props) {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("countriesPage");
  const tCommon = await getTranslations("common");
  const { code } = await params;
  const country = await getCountryByCode(code);
  if (!country) notFound();

  return (
    <IntelShell maxWidth="wide">
      <PageHeader
        title={country.name}
        subtitle={t("detailSubtitle", {
          code: country.code,
          region: country.region ?? t("global"),
        })}
      >
        <IntelligenceScoreGauge score={country.intelligenceScore} label={tCommon("threatScore")} />
      </PageHeader>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className={editorial.sectionTitle}>{t("recentIncidents")}</h2>
          <ul className="mt-4 space-y-3">
            {country.incidents.map((inc) => (
              <li key={inc.id} className={`${editorial.panel} p-4`}>
                <div className="flex items-center gap-2">
                  <SeverityBadge severity={inc.severity} />
                  <span className="text-sm">{inc.type}</span>
                </div>
                {inc.article && (
                  <Link href={`/intel/${inc.article.slug}`} className={`${editorial.link} mt-2 block text-sm`}>
                    {localizeArticleRef(inc.article, locale).title}
                  </Link>
                )}
                <p className={`mt-1 ${editorial.meta}`}>{formatDate(inc.createdAt, locale)}</p>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className={editorial.sectionTitle}>{t("associatedActors")}</h2>
          <ul className="mt-4 space-y-2">
            {country.actors.map(({ actor }) => (
              <li key={actor.slug}>
                <Link href={`/actors/${actor.slug}`} className={`${editorial.link} flex items-center gap-2 text-sm`}>
                  <SeverityBadge severity={actor.threatLevel} />
                  {actor.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </IntelShell>
  );
}
