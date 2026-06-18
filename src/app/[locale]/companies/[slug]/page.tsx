import { Link } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { IntelShell } from "@/components/layout/IntelShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { IntelligenceScoreGauge } from "@/components/intel/IntelligenceScoreGauge";
import { SeverityBadge } from "@/components/intel/SeverityBadge";
import { DataTable } from "@/components/intel/DataTable";
import { editorial } from "@/lib/editorial";
import { formatDate } from "@/lib/constants";
import { getCompanyBySlug } from "@/lib/data";
import { localizeArticleRef } from "@/lib/localize";
import type { Locale } from "@/i18n/routing";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const company = await getCompanyBySlug(slug);
  return { title: company?.name ?? "Company Not Found" };
}

export default async function CompanyDetailPage({ params }: Props) {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("companiesPage");
  const tCommon = await getTranslations("common");
  const { slug } = await params;
  const company = await getCompanyBySlug(slug);
  if (!company) notFound();

  return (
    <IntelShell maxWidth="wide">
      <PageHeader title={company.name} subtitle={company.industry}>
        <IntelligenceScoreGauge score={company.intelligenceScore} label={tCommon("intelScore")} />
      </PageHeader>

      {company.headquarters && (
        <p className={`mb-6 ${editorial.meta}`}>
          {t("hq", { location: company.headquarters })}
        </p>
      )}

      <div className="space-y-8">
        <section>
          <h2 className={editorial.sectionTitle}>{t("breachesSection")}</h2>
          <div className="mt-4">
            <DataTable
              data={company.breaches}
              keyField="id"
              emptyMessage={t("noBreaches")}
              columns={[
                { key: "records", header: t("records"), render: (r) => r.recordsExposed },
                { key: "severity", header: t("severity"), render: (r) => <SeverityBadge severity={r.severity} /> },
                { key: "date", header: t("date"), render: (r) => formatDate(r.breachDate) },
              ]}
            />
          </div>
        </section>

        <section>
          <h2 className={editorial.sectionTitle}>{t("relatedReports")}</h2>
          <ul className="mt-4 space-y-2">
            {company.articles.map(({ article }) => {
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
      </div>
    </IntelShell>
  );
}
