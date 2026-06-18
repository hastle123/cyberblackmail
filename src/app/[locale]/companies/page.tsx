import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { IntelShell } from "@/components/layout/IntelShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { IntelligenceScoreGauge } from "@/components/intel/IntelligenceScoreGauge";
import { editorial } from "@/lib/editorial";
import { getCompanies } from "@/lib/data";

export async function generateMetadata() {
  const t = await getTranslations("companiesPage");
  return { title: t("title") };
}

export default async function CompaniesPage() {
  const t = await getTranslations("companiesPage");
  const companies = await getCompanies();

  return (
    <IntelShell maxWidth="wide">
      <PageHeader title={t("title")} subtitle={t("subtitle", { count: companies.length })} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {companies.map((company) => (
          <Link
            key={company.id}
            href={`/companies/${company.slug}`}
            className={`${editorial.panel} group p-5 transition hover:border-[#c41e1e]/30`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className={`text-sm font-semibold text-[#d4d4d4] group-hover:text-[#e52525] ${editorial.heading}`}>
                  {company.name}
                </h2>
                <p className={`mt-1 ${editorial.meta}`}>{company.industry}</p>
              </div>
              <IntelligenceScoreGauge score={company.intelligenceScore} size={44} />
            </div>
            <div className={`mt-4 flex flex-wrap gap-3 ${editorial.meta}`}>
              <span>{t("incidents", { count: company._count.incidents })}</span>
              <span>{t("breaches", { count: company._count.breaches })}</span>
              <span>{t("reports", { count: company._count.articles })}</span>
            </div>
          </Link>
        ))}
      </div>
    </IntelShell>
  );
}
