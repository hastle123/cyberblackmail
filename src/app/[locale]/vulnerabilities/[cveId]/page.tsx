import { Link } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { IntelShell } from "@/components/layout/IntelShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { SeverityBadge } from "@/components/intel/SeverityBadge";
import { IntelligenceScoreGauge } from "@/components/intel/IntelligenceScoreGauge";
import { editorial } from "@/lib/editorial";
import { formatDate, jsonArray } from "@/lib/constants";
import { getCVEById } from "@/lib/data";
import { localizeArticleRef } from "@/lib/localize";
import type { Locale } from "@/i18n/routing";

type Props = { params: Promise<{ cveId: string }> };

export async function generateMetadata({ params }: Props) {
  const { cveId } = await params;
  const cve = await getCVEById(cveId);
  return { title: cve?.cveId ?? "CVE Not Found" };
}

export default async function CVEDetailPage({ params }: Props) {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("vulnsPage");
  const tCommon = await getTranslations("common");
  const { cveId } = await params;
  const cve = await getCVEById(cveId);
  if (!cve) notFound();

  const vendors = jsonArray(cve.affectedVendors);

  return (
    <IntelShell maxWidth="wide">
      <PageHeader
        title={cve.cveId}
        subtitle={t("detailSubtitle", { score: cve.cvssScore.toFixed(1), status: cve.exploitationStatus })}
      >
        <div className="flex items-center gap-3">
          <SeverityBadge severity={cve.severity} pulse={cve.severity === "CRITICAL"} />
          <IntelligenceScoreGauge score={cve.intelligenceScore} label={tCommon("intelScore")} />
        </div>
      </PageHeader>

      <div className={`${editorial.panel} mb-8 p-6`}>
        <p className={editorial.body}>{cve.description}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {vendors.map((v) => (
            <span key={v} className={`${editorial.tag} border-white/10 bg-transparent text-[#888]`}>
              {v}
            </span>
          ))}
        </div>
        <p className={`mt-4 ${editorial.meta}`}>
          {t("publishedOn", { date: formatDate(cve.publishedAt) })}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className={editorial.sectionTitle}>{t("relatedReports")}</h2>
          <ul className="mt-4 space-y-2">
            {cve.articles.map(({ article }) => {
              const localized = localizeArticleRef(article, locale);
              return (
                <li key={article.slug}>
                  <Link href={`/intel/${article.slug}`} className={`${editorial.link} flex items-center gap-2 text-sm`}>
                    <SeverityBadge severity={article.severity} />
                    {localized.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
        <section>
          <h2 className={editorial.sectionTitle}>{t("exploitedBy")}</h2>
          <ul className="mt-4 space-y-2">
            {cve.actors.map(({ actor }) => (
              <li key={actor.slug}>
                <Link href={`/actors/${actor.slug}`} className={`${editorial.link} text-sm`}>
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
